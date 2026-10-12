/*
 * schema.js — single source of truth for the questionnaire in the browser.
 * Mirrors Sheet1 of Energy_Assessment.xlsx.
 * Electricity connections and WASH facilities are counted separately:
 * one consumption profile is filled per electricity connection, and each
 * profile records which WASH facility it serves.
 * The same rules are repeated in apps-script/Code.gs, because the server
 * must never trust validation done in the browser. Keep both in step.
 */
(function () {
  'use strict';

  const MAX_PER_TYPE = 5000;        // facilities of one type
  const MAX_CONNECTIONS = 2000;    // electricity connections per ULB

  // City profile rows B6:B14
  const facilityTypes = [
    { key: 'jackwell',     code: 'JW',   label: 'Jackwell / Main source' },
    { key: 'tubewell',     code: 'TW',   label: 'Groundwater tubewell / Borewell' },
    { key: 'wtp',          code: 'WTP',  label: 'Water Treatment Plant (WTP)' },
    { key: 'filter_house', code: 'FH',   label: 'Filter house' },
    { key: 'esr',          code: 'ESR',  label: 'Elevated Storage Reservoir (ESR)' },
    { key: 'sump',         code: 'GSR',  label: 'Sump / Ground storage reservoir' },
    { key: 'sps',          code: 'SPS',  label: 'Sewage Pumping Station' },
    { key: 'stp',          code: 'STP',  label: 'Sewage Treatment Plant (STP)' },
    { key: 'swm',          code: 'SWM',  label: 'Solid waste processing facility / FSTP' }
  ];

  const groups = [
    { key: 'facility', label: 'Facility and connection' },
    { key: 'solar',    label: 'Solar installation' },
    { key: 'load',     label: 'Load and demand' },
    { key: 'billing',  label: 'Consumption and billing', badge: 'Average of last 12 monthly bills' },
    { key: 'tod',      label: 'Operating hours by time-of-day slab', badge: 'Hours per slab' }
  ];

  // Energy consumption questionnaire rows A17:A37
  const fields = [
    { key: 'facility_types',      group: 'facility', label: 'Facility types served', type: 'facilityTypes', wide: true },
    { key: 'facility_name',       group: 'facility', label: 'Facility name', type: 'text', maxLen: 120 },
    { key: 'consumer_no',         group: 'facility', label: 'Consumer number (MSEDCL)', type: 'digits', minLen: 6, maxLen: 15 },
    { key: 'capacity_mld',        group: 'facility', label: 'Facility capacity', unit: 'MLD', type: 'number', min: 0, max: 5000 },
    { key: 'discom_region',       group: 'facility', label: 'DISCOM region', type: 'text', maxLen: 60 },
    { key: 'unit_rate',           group: 'facility', label: 'Unit electricity rate', unit: '₹/kVAh', type: 'number', min: 0, max: 100 },
    { key: 'connection_type',     group: 'facility', label: 'Connection type', type: 'select', options: ['Urban', 'Rural'] },

    { key: 'solar_kw',            group: 'solar', label: 'Solar capacity', unit: 'kW', type: 'number', min: 0, max: 100000, na: true },
    { key: 'solar_year',          group: 'solar', label: 'Year installed', type: 'year', min: 1990, na: true },

    { key: 'connected_load_kw',   group: 'load', label: 'Connected load', unit: 'kW', type: 'number', min: 0, max: 1000000 },
    { key: 'contract_demand_kva', group: 'load', label: 'Contract demand', unit: 'kVA', type: 'number', min: 0, max: 1000000 },
    { key: 'avg_max_demand_kva',  group: 'load', label: 'Avg. monthly maximum demand', unit: 'kVA', type: 'number', min: 0, max: 1000000 },

    { key: 'avg_units_kvah',      group: 'billing', label: 'Avg. monthly consumption', unit: 'kVAh', type: 'number', min: 0, max: 100000000 },
    { key: 'avg_pf',              group: 'billing', label: 'Avg. billed power factor', unit: 'P.F.', type: 'number', min: 0, max: 1, placeholder: '0.95' },
    { key: 'principal_arrears',   group: 'billing', label: 'Principal arrears', unit: '₹', type: 'number', min: 0, max: 10000000000 },
    { key: 'avg_bill_amount',     group: 'billing', label: 'Avg. monthly bill amount', unit: '₹', type: 'number', min: 0, max: 10000000000 },

    { key: 'tod_00_06',           group: 'tod', label: '00:00 – 06:00', type: 'tod' },
    { key: 'tod_06_12',           group: 'tod', label: '06:00 – 12:00', type: 'tod' },
    { key: 'tod_12_18',           group: 'tod', label: '12:00 – 18:00', type: 'tod' },
    { key: 'tod_18_24',           group: 'tod', label: '18:00 – 24:00', type: 'tod' }
  ];

  const todOptions = [{ value: 'NA', label: 'NA' }]
    .concat([1, 2, 3, 4, 5, 6].map(n => ({ value: String(n), label: n + ' h' })));

  const BILL = {
    maxBytes: 10 * 1024 * 1024,
    accept: '.pdf,.jpg,.jpeg,.png',
    mimes: ['application/pdf', 'image/jpeg', 'image/png']
  };

  /** Accepts ['esr','sump'] or 'esr,sump'; returns a de-duplicated array in schema order. */
  function parseTypes(v) {
    const list = Array.isArray(v) ? v : String(v || '').split(',');
    const set = new Set(list.map(x => String(x).trim()).filter(Boolean));
    const known = facilityTypes.map(t => t.key).filter(k => set.has(k));
    const unknown = [...set].filter(k => known.indexOf(k) === -1);
    return known.concat(unknown);
  }

  /** Returns { valid, errors: {key: msg}, clean: {key: value} } */
  function validateFacility(input) {
    const errors = {}, clean = {};
    const thisYear = new Date().getFullYear();

    fields.forEach(f => {
      let v = input[f.key];
      if (f.type === 'facilityTypes') v = parseTypes(v).join(',');
      v = (v === null || v === undefined) ? '' : String(v).trim();

      if (f.na && v.toUpperCase() === 'NA') { clean[f.key] = 'NA'; return; }
      if (v === '') { errors[f.key] = f.type === 'facilityTypes' ? 'Select at least one facility type.' : f.type === 'tod' ? 'Select hours or NA.' : 'Required.'; return; }

      switch (f.type) {
        case 'text':
          if (v.length > f.maxLen) errors[f.key] = 'Keep this under ' + f.maxLen + ' characters.';
          else clean[f.key] = v;
          break;
        case 'digits':
          if (!/^\d+$/.test(v)) errors[f.key] = 'Use digits only.';
          else if (v.length < f.minLen || v.length > f.maxLen) errors[f.key] = 'Enter ' + f.minLen + ' to ' + f.maxLen + ' digits.';
          else clean[f.key] = v;
          break;
        case 'number': {
          const n = Number(v.replace(/,/g, ''));
          if (!Number.isFinite(n)) errors[f.key] = 'Enter a number.';
          else if (n < f.min || n > f.max) errors[f.key] = 'Enter a value from ' + f.min + ' to ' + f.max + '.';
          else clean[f.key] = n;
          break;
        }
        case 'year': {
          const n = Number(v);
          if (!/^\d{4}$/.test(v) || n < f.min || n > thisYear) errors[f.key] = 'Enter a year from ' + f.min + ' to ' + thisYear + '.';
          else clean[f.key] = n;
          break;
        }
        case 'facilityTypes': {
          const keys = parseTypes(input[f.key]);
          if (!keys.length) errors[f.key] = 'Select at least one facility type.';
          else if (keys.some(k => !facilityTypes.some(t => t.key === k))) errors[f.key] = 'Unknown facility type.';
          else clean[f.key] = keys;
          break;
        }
        case 'select':
          if (f.options.indexOf(v) === -1) errors[f.key] = 'Choose one option.';
          else clean[f.key] = v;
          break;
        case 'tod':
          if (!todOptions.some(o => o.value === v)) errors[f.key] = 'Select hours or NA.';
          else clean[f.key] = v === 'NA' ? 'NA' : Number(v);
          break;
      }
    });

    // Solar: both NA, or both filled
    if (clean.solar_kw === 'NA') clean.solar_year = 'NA', delete errors.solar_year;
    else if (clean.solar_year === 'NA') errors.solar_year = 'Enter the installation year, or tick “No solar installation”.';

    return { valid: Object.keys(errors).length === 0, errors, clean };
  }

  window.SCHEMA = Object.freeze({
    MAX_PER_TYPE, MAX_CONNECTIONS, facilityTypes, groups, fields, todOptions, BILL, validateFacility, parseTypes
  });
})();

export const PARTS = [
  {
    id: "p1",
    psNumber: "PS11752778",
    partNumber: "W10882923",
    name: "Refrigerator Ice Maker Assembly",
    applianceType: "refrigerator",
    manufacturer: "Whirlpool",
    replaces: ["W10300022", "W10377151"],
    symptoms: ["ice maker not working", "no ice production", "slow ice"],
    price: 129.99,
    inStock: true,
    shippingEta: "2-4 business days"
  },
  {
    id: "p2",
    psNumber: "PS11750057",
    partNumber: "W10620296",
    name: "Dishwasher Water Inlet Valve",
    applianceType: "dishwasher",
    manufacturer: "Whirlpool",
    replaces: ["W10212596"],
    symptoms: ["dishwasher not filling", "low water pressure"],
    price: 43.49,
    inStock: true,
    shippingEta: "2-3 business days"
  },
  {
    id: "p3",
    psNumber: "PS12584610",
    partNumber: "W11025157",
    name: "Dishwasher Pump and Motor Assembly",
    applianceType: "dishwasher",
    manufacturer: "Whirlpool",
    replaces: ["W10894668"],
    symptoms: ["not cleaning dishes", "strange motor noise", "not draining"],
    price: 189.0,
    inStock: false,
    shippingEta: "Backorder: 7-10 business days"
  }
];

export const MODEL_FITS = [
  {
    modelNumber: "WDT780SAEM1",
    psNumber: "PS11750057",
    fitConfidence: "high",
    notes: "Exact model match from compatibility matrix."
  },
  {
    modelNumber: "WDT780SAEM1",
    psNumber: "PS12584610",
    fitConfidence: "medium",
    notes: "Fits most revisions. Verify serial prefix for exact revision."
  },
  {
    modelNumber: "WRF535SWHZ",
    psNumber: "PS11752778",
    fitConfidence: "high",
    notes: "Confirmed for this Whirlpool refrigerator family."
  }
];

export const DOC_SNIPPETS = [
  {
    id: "doc-ice-1",
    applianceType: "refrigerator",
    brand: "Whirlpool",
    partNumber: "PS11752778",
    docType: "installation",
    title: "Ice Maker Assembly Installation Guide",
    url: "https://www.partselect.com/ps11752778-installation-guide",
    content:
      "Disconnect power and water supply. Remove the ice bin and mounting screws. Disconnect harness, swap assembly, and re-secure. Restore power and run a harvest cycle test.",
    updatedAt: "2025-09-10"
  },
  {
    id: "doc-dw-1",
    applianceType: "dishwasher",
    brand: "Whirlpool",
    partNumber: "PS11750057",
    docType: "installation",
    title: "Dishwasher Inlet Valve Replacement Steps",
    url: "https://www.partselect.com/ps11750057-installation-guide",
    content:
      "Turn off water and power. Remove kick plate. Disconnect inlet hose and wiring harness from valve. Install new valve and check for leaks before running a test cycle.",
    updatedAt: "2025-07-19"
  },
  {
    id: "doc-troubleshoot-ice-1",
    applianceType: "refrigerator",
    brand: "Whirlpool",
    partNumber: null,
    docType: "troubleshooting",
    title: "Whirlpool Refrigerator Ice Maker Not Working",
    url: "https://www.partselect.com/blog/whirlpool-ice-maker-troubleshooting",
    content:
      "Start with water line and filter checks. Then inspect inlet valve, ice maker assembly, and optical sensor. Confirm freezer temperature is between 0F and 5F.",
    updatedAt: "2025-11-01"
  }
];

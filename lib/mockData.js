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
  },
  {
    id: "p4",
    psNumber: "PS11722128",
    partNumber: "W10278635",
    name: "Refrigerator Water Inlet Valve",
    applianceType: "refrigerator",
    manufacturer: "Whirlpool",
    replaces: ["W10159839"],
    symptoms: ["water dispenser not working", "ice maker no water", "low water flow"],
    price: 57.29,
    inStock: true,
    shippingEta: "2-4 business days"
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
  },
  {
    modelNumber: "WRF535SWHZ",
    psNumber: "PS11722128",
    fitConfidence: "high",
    notes: "Confirmed fit for water supply system on this model."
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
  },
  {
    id: "doc-dw-2",
    applianceType: "dishwasher",
    brand: "Whirlpool",
    partNumber: "PS12584610",
    docType: "installation",
    title: "Dishwasher Pump and Motor Assembly Replacement",
    url: "https://www.partselect.com/ps12584610-installation-guide",
    content:
      "Disconnect power and water. Remove lower spray arm and filter housing. Access sump area, disconnect motor harness and hoses, replace assembly, then run leak and wash tests.",
    updatedAt: "2025-08-14"
  },
  {
    id: "doc-troubleshoot-dw-1",
    applianceType: "dishwasher",
    brand: "Whirlpool",
    partNumber: null,
    docType: "troubleshooting",
    title: "Dishwasher Not Cleaning or Not Draining",
    url: "https://www.partselect.com/blog/dishwasher-not-draining-troubleshooting",
    content:
      "Check filter blockage, drain loop, and pump impeller first. If motor noise persists, inspect pump and motor assembly and verify inlet water volume.",
    updatedAt: "2025-10-02"
  },
  {
    id: "doc-ice-2",
    applianceType: "refrigerator",
    brand: "Whirlpool",
    partNumber: "PS11722128",
    docType: "installation",
    title: "Refrigerator Water Inlet Valve Replacement",
    url: "https://www.partselect.com/ps11722128-installation-guide",
    content:
      "Unplug unit and shut off water. Pull refrigerator forward, remove rear panel, disconnect supply lines and harness from valve, replace valve, and test for leaks.",
    updatedAt: "2025-06-28"
  }
];

export const INSTALL_STEPS = {
  PS11752778: [
    "Unplug refrigerator and shut off water supply.",
    "Remove ice bin and mounting hardware from the ice maker housing.",
    "Disconnect wire harness and release the old ice maker assembly.",
    "Install new assembly, reconnect harness, and secure all screws.",
    "Restore power/water and run a test harvest cycle."
  ],
  PS11750057: [
    "Disconnect dishwasher power and water supply.",
    "Remove lower kick plate to access inlet valve.",
    "Disconnect inlet hose and wire terminals from old valve.",
    "Install new valve, reconnect wiring/hose, and tighten fittings.",
    "Restore utilities and run a short cycle to check leaks."
  ],
  PS12584610: [
    "Disconnect dishwasher power and water supply.",
    "Remove lower rack, spray arm, and filter assembly to access the sump.",
    "Disconnect motor wiring harness and attached hoses from the old pump assembly.",
    "Install the new pump and motor assembly and resecure all clamps and connectors.",
    "Restore utilities and run a short wash/drain cycle to verify operation and leaks."
  ],
  PS11722128: [
    "Unplug refrigerator and shut off water supply.",
    "Pull the unit out and remove the lower rear service panel.",
    "Disconnect inlet/outlet water lines and wire harness from the old valve.",
    "Install new valve, reconnect all lines and wiring, and secure the panel.",
    "Turn water back on, restore power, and check for leaks and dispenser flow."
  ]
};

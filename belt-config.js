(function globalConfig() {
  // Base yields por unidad de ore (ejemplo)
  const baseYields = {
    'Eifyrium': { Tritanium: 50, Mexallon: 25 },
    'Hezorime': { Tritanium: 30, Mexallon: 40, Zydrine: 10 },
    'Nocxite': { Tritanium: 20, Mexallon: 20, Nocxium: 60 },
    'Hedbergite': { Mexallon: 300, Isogen: 300, Zydrine: 200 },
    'Arkonor': { Tritanium: 200, Mexallon: 200, Megacyte: 600 },
    'Bistot': { Pyerite: 200, Zydrine: 300, Megacyte: 500 }
  };

  const variants = {
    'Augmented': 1.15, 'Boosted': 1.10, 'Doped': 1.05, 'Dull': 0.95,
    'Serrated': 1.20, 'Fragrant': 1.10, 'Intoxicating': 1.05, 'Ambrosial': 1.25
  };

  const compressionRatios = {
    'Eifyrium': 0.01, 'Hezorime': 0.01, 'Nocxite': 0.01, 'Arkonor': 0.01, 'Bistot': 0.01, 'Hedbergite': 0.01
  };

  const compressedPrices = {
    'Eifyrium': 12000, 'Hezorime': 15000, 'Nocxite': 18000, 'Arkonor': 20000, 'Bistot': 22000, 'Hedbergite': 10000
  };

  const defaultPilots = [
    { name: 'ALPHA', modules: 2, m3PerCycle: 1800, cycleSec: 50 },
    { name: 'BRAVO', modules: 2, m3PerCycle: 1800, cycleSec: 50 },
    { name: 'CHARLY', modules: 2, m3PerCycle: 1800, cycleSec: 50 },
    { name: 'DELTA', modules: 2, m3PerCycle: 1800, cycleSec: 50 },
    { name: 'EPSYLON', modules: 2, m3PerCycle: 1800, cycleSec: 50 }
  ];

  window.beltBaseYields = baseYields;
  window.beltConfig = {
    variants,
    compressionRatios,
    compressedPrices,
    defaultPilots
  };

  try { Object.freeze(window.beltBaseYields); Object.freeze(window.beltConfig); } catch (e) {}
})();

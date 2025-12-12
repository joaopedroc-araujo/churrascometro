import AsyncStorage from "@react-native-async-storage/async-storage";

// ============ TIPOS ============

export interface CustomPrices {
  [key: string]: number;
}

export interface CustomItem {
  key: string;
  label: string;
  price: number;
  unit: string;
  category: string;
}

export interface ChecklistState {
  [key: string]: boolean;
}

export interface ChurrascoProfile {
  id: string;
  name: string;
  icon: string;
  description: string;
  config: {
    meatAdults: number;
    vegetarianAdults: number;
    children: number;
    beerDrinkers: number;
    duration: "short" | "long";
    selectedMeats: Record<string, boolean>;
  };
}

export interface SavedChurrasco {
  id: string;
  name: string;
  date: string;
  config: ChurrascoProfile["config"];
  totalCost: number;
}

// ============ KEYS ============

const KEYS = {
  CUSTOM_PRICES: "@churrascometro:custom_prices",
  CUSTOM_ITEMS: "@churrascometro:custom_items",
  CHECKLIST: "@churrascometro:checklist",
  SAVED_CHURRASCOS: "@churrascometro:saved_churrascos",
  LAST_CALCULATION: "@churrascometro:last_calculation",
};

// ============ ITENS CUSTOMIZADOS ============

export async function getCustomItems(): Promise<CustomItem[]> {
  try {
    const data = await AsyncStorage.getItem(KEYS.CUSTOM_ITEMS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function saveCustomItem(item: CustomItem): Promise<void> {
  try {
    const items = await getCustomItems();
    const existingIndex = items.findIndex((i) => i.key === item.key);
    if (existingIndex >= 0) {
      items[existingIndex] = item;
    } else {
      items.push(item);
    }
    await AsyncStorage.setItem(KEYS.CUSTOM_ITEMS, JSON.stringify(items));
  } catch (error) {
    console.error("Erro ao salvar item:", error);
  }
}

export async function deleteCustomItem(key: string): Promise<void> {
  try {
    const items = await getCustomItems();
    const filtered = items.filter((i) => i.key !== key);
    await AsyncStorage.setItem(KEYS.CUSTOM_ITEMS, JSON.stringify(filtered));
  } catch (error) {
    console.error("Erro ao deletar item:", error);
  }
}

// ============ PREÇOS CUSTOMIZADOS ============

export async function getCustomPrices(): Promise<CustomPrices> {
  try {
    const data = await AsyncStorage.getItem(KEYS.CUSTOM_PRICES);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

export async function saveCustomPrices(prices: CustomPrices): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.CUSTOM_PRICES, JSON.stringify(prices));
  } catch (error) {
    console.error("Erro ao salvar preços:", error);
  }
}

export async function resetPrices(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEYS.CUSTOM_PRICES);
  } catch (error) {
    console.error("Erro ao resetar preços:", error);
  }
}

// ============ CHECKLIST ============

export async function getChecklist(): Promise<ChecklistState> {
  try {
    const data = await AsyncStorage.getItem(KEYS.CHECKLIST);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

export async function saveChecklist(checklist: ChecklistState): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.CHECKLIST, JSON.stringify(checklist));
  } catch (error) {
    console.error("Erro ao salvar checklist:", error);
  }
}

export async function clearChecklist(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEYS.CHECKLIST);
  } catch (error) {
    console.error("Erro ao limpar checklist:", error);
  }
}

// ============ ÚLTIMO CÁLCULO (para checklist) ============

export interface LastCalculation {
  items: Array<{
    key: string;
    label: string;
    quantity: string;
    price: number;
    section: string;
  }>;
  totalCost: number;
  date: string;
}

export async function getLastCalculation(): Promise<LastCalculation | null> {
  try {
    const data = await AsyncStorage.getItem(KEYS.LAST_CALCULATION);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export async function saveLastCalculation(
  calculation: LastCalculation
): Promise<void> {
  try {
    await AsyncStorage.setItem(
      KEYS.LAST_CALCULATION,
      JSON.stringify(calculation)
    );
  } catch (error) {
    console.error("Erro ao salvar cálculo:", error);
  }
}

// ============ CHURRASCOS SALVOS ============

export async function getSavedChurrascos(): Promise<SavedChurrasco[]> {
  try {
    const data = await AsyncStorage.getItem(KEYS.SAVED_CHURRASCOS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function saveChurrasco(churrasco: SavedChurrasco): Promise<void> {
  try {
    const churrascos = await getSavedChurrascos();
    churrascos.unshift(churrasco); // Adiciona no início
    // Mantém apenas os últimos 10
    const limited = churrascos.slice(0, 10);
    await AsyncStorage.setItem(KEYS.SAVED_CHURRASCOS, JSON.stringify(limited));
  } catch (error) {
    console.error("Erro ao salvar churrasco:", error);
  }
}

export async function deleteChurrasco(id: string): Promise<void> {
  try {
    const churrascos = await getSavedChurrascos();
    const filtered = churrascos.filter((c) => c.id !== id);
    await AsyncStorage.setItem(KEYS.SAVED_CHURRASCOS, JSON.stringify(filtered));
  } catch (error) {
    console.error("Erro ao deletar churrasco:", error);
  }
}

// ============ PERFIS PRÉ-DEFINIDOS ============

export const CHURRASCO_PROFILES: ChurrascoProfile[] = [
  {
    id: "festa-grande",
    name: "Festa Grande",
    icon: "🎉",
    description: "30+ pessoas, variedade completa",
    config: {
      meatAdults: 25,
      vegetarianAdults: 5,
      children: 8,
      beerDrinkers: 20,
      duration: "long",
      selectedMeats: {
        picanha: true,
        costela: true,
        linguica: true,
        frango: true,
        maminha: true,
        fraldinha: true,
      },
    },
  },
  {
    id: "familia",
    name: "Família",
    icon: "👨‍👩‍👧‍👦",
    description: "8-12 pessoas, equilibrado",
    config: {
      meatAdults: 6,
      vegetarianAdults: 2,
      children: 4,
      beerDrinkers: 4,
      duration: "long",
      selectedMeats: {
        picanha: true,
        costela: true,
        linguica: true,
        frango: true,
        maminha: false,
        fraldinha: false,
      },
    },
  },
  {
    id: "amigos",
    name: "Só os Amigos",
    icon: "🍻",
    description: "6-8 adultos, mais cerveja",
    config: {
      meatAdults: 8,
      vegetarianAdults: 0,
      children: 0,
      beerDrinkers: 8,
      duration: "long",
      selectedMeats: {
        picanha: true,
        costela: true,
        linguica: true,
        frango: true,
        maminha: true,
        fraldinha: false,
      },
    },
  },
  {
    id: "casal",
    name: "Casal",
    icon: "💑",
    description: "2 pessoas, íntimo",
    config: {
      meatAdults: 2,
      vegetarianAdults: 0,
      children: 0,
      beerDrinkers: 2,
      duration: "short",
      selectedMeats: {
        picanha: true,
        costela: false,
        linguica: true,
        frango: false,
        maminha: false,
        fraldinha: false,
      },
    },
  },
  {
    id: "fit",
    name: "Churrasco Fit",
    icon: "🥗",
    description: "Foco em proteína magra",
    config: {
      meatAdults: 4,
      vegetarianAdults: 2,
      children: 0,
      beerDrinkers: 2,
      duration: "short",
      selectedMeats: {
        picanha: false,
        costela: false,
        linguica: false,
        frango: true,
        maminha: true,
        fraldinha: true,
      },
    },
  },
  {
    id: "vegetariano",
    name: "Vegetariano",
    icon: "🌱",
    description: "Sem carnes, só opções vegetarianas",
    config: {
      meatAdults: 0,
      vegetarianAdults: 8,
      children: 2,
      beerDrinkers: 4,
      duration: "short",
      selectedMeats: {
        picanha: false,
        costela: false,
        linguica: false,
        frango: false,
        maminha: false,
        fraldinha: false,
      },
    },
  },
];

// ============ PERFIS CUSTOMIZADOS ============

const KEYS_CUSTOM_PROFILES = "@churrascometro:custom_profiles";

export async function getCustomProfiles(): Promise<ChurrascoProfile[]> {
  try {
    const data = await AsyncStorage.getItem(KEYS_CUSTOM_PROFILES);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function saveCustomProfile(
  profile: ChurrascoProfile
): Promise<void> {
  try {
    const profiles = await getCustomProfiles();
    // Verifica se já existe um perfil com o mesmo nome
    const existingIndex = profiles.findIndex((p) => p.id === profile.id);
    if (existingIndex >= 0) {
      profiles[existingIndex] = profile;
    } else {
      profiles.unshift(profile);
    }
    // Limita a 5 perfis customizados
    const limited = profiles.slice(0, 5);
    await AsyncStorage.setItem(KEYS_CUSTOM_PROFILES, JSON.stringify(limited));
  } catch (error) {
    console.error("Erro ao salvar perfil:", error);
  }
}

export async function deleteCustomProfile(id: string): Promise<void> {
  try {
    const profiles = await getCustomProfiles();
    const filtered = profiles.filter((p) => p.id !== id);
    await AsyncStorage.setItem(KEYS_CUSTOM_PROFILES, JSON.stringify(filtered));
  } catch (error) {
    console.error("Erro ao deletar perfil:", error);
  }
}

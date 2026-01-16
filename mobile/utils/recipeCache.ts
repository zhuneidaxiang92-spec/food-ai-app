import AsyncStorage from "@react-native-async-storage/async-storage";

const CACHE_PREFIX = "recipe_cache_";
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export interface CachedRecipe {
    recipe: any;
    timestamp: number;
}

/**
 * Get cached recipe by name
 * @param recipeName - Name of the recipe
 * @returns Recipe data if cache is valid, null otherwise
 */
export async function getCachedRecipe(recipeName: string): Promise<any | null> {
    try {
        const cacheKey = `${CACHE_PREFIX}${recipeName}`;
        const cached = await AsyncStorage.getItem(cacheKey);

        if (!cached) {
            return null;
        }

        const { recipe, timestamp }: CachedRecipe = JSON.parse(cached);
        const now = Date.now();

        // Check if cache is expired
        if (now - timestamp > CACHE_EXPIRY) {
            // Remove expired cache
            await AsyncStorage.removeItem(cacheKey);
            return null;
        }

        return recipe;
    } catch (error) {
        console.error("Error getting cached recipe:", error);
        return null;
    }
}

/**
 * Set cached recipe
 * @param recipeName - Name of the recipe
 * @param recipe - Recipe data to cache
 */
export async function setCachedRecipe(recipeName: string, recipe: any): Promise<void> {
    try {
        const cacheKey = `${CACHE_PREFIX}${recipeName}`;
        const cacheData: CachedRecipe = {
            recipe,
            timestamp: Date.now(),
        };

        await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
        console.error("Error setting cached recipe:", error);
    }
}

/**
 * Clear all expired recipe caches
 */
export async function clearExpiredCache(): Promise<void> {
    try {
        const keys = await AsyncStorage.getAllKeys();
        const cacheKeys = keys.filter((key) => key.startsWith(CACHE_PREFIX));
        const now = Date.now();

        for (const key of cacheKeys) {
            const cached = await AsyncStorage.getItem(key);
            if (cached) {
                const { timestamp }: CachedRecipe = JSON.parse(cached);
                if (now - timestamp > CACHE_EXPIRY) {
                    await AsyncStorage.removeItem(key);
                }
            }
        }
    } catch (error) {
        console.error("Error clearing expired cache:", error);
    }
}

/**
 * Clear all recipe caches
 */
export async function clearAllRecipeCache(): Promise<void> {
    try {
        const keys = await AsyncStorage.getAllKeys();
        const cacheKeys = keys.filter((key) => key.startsWith(CACHE_PREFIX));
        await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
        console.error("Error clearing all recipe cache:", error);
    }
}

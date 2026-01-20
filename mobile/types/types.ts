// ==============================================
// User Types
// ==============================================

export interface User {
    id: number;
    name: string;
    email: string;
    profile_image?: string;
    google_id?: string;
    created_at?: string;
    updated_at?: string;
}

// ==============================================
// Recipe Types
// ==============================================

export interface Recipe {
    name_jp: string;
    name_en: string;
    image?: string;
    instructions_jp: string;
    instructions_en?: string;
    ingredients_jp: string[];
    ingredients_en?: Array<{
        ingredient: string;
        measure: string;
    }>;
    sourceUrl?: string;
    description?: string;
    note?: string; // For favorites
}

// ==============================================
// Community Post Types
// ==============================================

export interface CommunityPost {
    id: number;
    dish_name: string;
    dish_image: string;
    opinion?: string;
    user_id: number;
    user_name: string;
    likes: number;
    is_liked: boolean;
    comments: number;
    created_at: string;
}

export interface CreatePostRequest {
    user_id: number;
    dish_name: string;
    dish_image: string;
    opinion?: string;
}

// ==============================================
// Comment Types
// ==============================================

export interface Comment {
    id: number;
    post_id: number;
    user_id: number;
    user_name: string;
    comment: string;
    created_at: string;
    parent_id?: number;
}

export interface CreateCommentRequest {
    user_id: number;
    comment: string;
    parent_id?: number;
}

// ==============================================
// Notification Types
// ==============================================

export interface Notification {
    id: number;
    user_id: number;
    type: 'like' | 'comment' | 'reply' | 'system';
    title: string;
    message: string;
    related_id?: number;
    read: number; // 0: unread, 1: read
    created_at: string;
}

// ==============================================
// API Response Types
// ==============================================

export interface ApiResponse<T> {
    data?: T;
    error?: string;
    message?: string;
}

export interface PredictResponse {
    predicted_food_en: string;
    predicted_food_jp: string;
    confidence: number;
    recipe_found: boolean;
    recipe?: Recipe;
}

// ==============================================
// Navigation Types
// ==============================================

export type RootStackParamList = {
    Tabs: undefined;
    Login: undefined;
    Signup: undefined;
    Recipe: {
        recipe?: Recipe;
        recipeName?: string;
    };
    Result: {
        result: PredictResponse;
    };
    Comments: {
        post: CommunityPost;
    };
    Profile: undefined;
    Settings: undefined;
    History: undefined;
    Favorites: undefined;
};

// ==============================================
// History Item Type
// ==============================================

export interface HistoryItem {
    id: string;
    food_name_jp: string;
    food_name_en: string;
    image: string;
    confidence: number;
    timestamp: string;
    note?: string;
}

// ==============================================
// Network State Type
// ==============================================

export interface NetworkState {
    isConnected: boolean;
    isInternetReachable: boolean | null;
}

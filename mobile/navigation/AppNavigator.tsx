import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import LoginScreen from "../app/login";
import SignupScreen from "../app/signup";
import TabsNavigator from "./TabsNavigator";
import ResultScreen from "../app/result";
import RecipeScreen from "../app/recipe";

// ⭐ Signup onboarding screens
import SignupCategoryScreen from "../app/auth/SignupCategoryScreen";
import SignupFoodScreen from "../app/auth/SignupFoodScreen";
import AddPost from "../app/community/AddPost";
import SearchScreen from "../app/SearchScreen";
import ProfileScreen from "../app/profile";

export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  SignupCategoryScreen: { userId: number };
  SignupFoodScreen: { userId: number; category: string };
  Tabs: undefined;
  Result: { result: any; fallbackImage: any };
  Recipe: { recipe: any; recipeName?: string };
  Search: undefined;
  AddPost: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Tabs"
      screenOptions={{ headerShown: false }}
    >
      {/* AUTH SCREENS */}
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />

      {/* SIGNUP ONBOARDING FLOW */}
      <Stack.Screen
        name="SignupCategoryScreen"
        component={SignupCategoryScreen}
      />
      <Stack.Screen
        name="SignupFoodScreen"
        component={SignupFoodScreen}
      />

      {/* MAIN APP (BOTTOM TABS) */}
      <Stack.Screen name="Tabs" component={TabsNavigator} />

      {/* DETAIL SCREENS (Pushed on stack) */}
      <Stack.Screen name="Result" component={ResultScreen} />
      <Stack.Screen name="Recipe" component={RecipeScreen} />
      <Stack.Screen name="Search" component={SearchScreen} />

      {/* POST MODAL */}
      <Stack.Screen
        name="AddPost"
        component={AddPost}
        options={{ presentation: "modal" }} // Show as modal
      />

      {/* PROFILE SCREEN */}
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  );
}

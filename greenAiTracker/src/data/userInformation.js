'use strict';

// userInformation.js
import { models } from "./models.js";

// Icons for each company (companies not listed here just get no icon)
const companyIcons = {
    OpenAI: "/images/openai.png",
    Anthropic: "/images/anthropic.png",
    Google: "/images/google.png",
};

// Turns a list of model ids into full model objects from the models file
function resolveModels(ids) {
    return ids
        .map((id) => models.find((m) => m.id === id))
        .filter(Boolean) // skips any id that doesn't exist in the models file
        .map((m) => ({ ...m, icon: companyIcons[m.company] }));
}

// Builds a user. Only the favourite ids are stored;
// user.favouriteModels works out the full model objects from them each time it's read.
function createUser({ id, name, email, password, favouriteModelIds = [] }) {
    return {
        id,
        name,
        email,
        password,
        favouriteModelIds,
        get favouriteModels() {
            return resolveModels(this.favouriteModelIds);
        },
    };
}

// The list of all users
export const users = [
    createUser({
        id: 1,
        name: "Jack Johnston",
        email: "user@gmail.com",
        password: "Password",
        favouriteModelIds: ["gpt-6-astra", "claude-fable-5", "gpt-5.4-pro", "gemini-pro-latest"],
    }),
    createUser({
        id: 2,
        name: "Sam Taylor",
        email: "sam@gmail.com",
        password: "Password2",
        favouriteModelIds: ["claude-fable-5"],
    }),
];

// Keeps your old imports working: anything using currentUser still gets the first user
export const currentUser = users[0];

// Returns every user
export function getUsers() {
    return users;
}

// Finds a user by email (not case sensitive), or undefined if there isn't one
export function getUserByEmail(email) {
    return users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

// Finds a user by id, or undefined if there isn't one
export function getUserById(id) {
    return users.find((u) => u.id === id);
}

// Adds a new user and returns it.
// favouriteModelIds is a list of model ids from the models file, e.g. ["grok-5"]
export function addUser({ name, email, password, favouriteModelIds = [] }) {
    if (!name || !email || !password) {
        throw new Error("Name, email and password are required.");
    }
    if (getUserByEmail(email)) {
        throw new Error("A user with that email already exists.");
    }
    const unknown = favouriteModelIds.filter((id) => !models.some((m) => m.id === id));
    if (unknown.length) {
        throw new Error(`Unknown model id(s): ${unknown.join(", ")}`);
    }

    // New id = highest existing id + 1
    const id = users.length ? Math.max(...users.map((u) => u.id)) + 1 : 1;

    const newUser = createUser({ id, name, email, password, favouriteModelIds: [...favouriteModelIds] });
    users.push(newUser);
    return newUser;
}

// Adds a model to a user's favourites
export function addFavourite(userId, modelId) {
    const user = getUserById(userId);
    if (!user) throw new Error("User not found.");
    if (!models.some((m) => m.id === modelId)) throw new Error("Unknown model id.");
    if (!user.favouriteModelIds.includes(modelId)) user.favouriteModelIds.push(modelId);
    return user;
}

// Removes a model from a user's favourites
export function removeFavourite(userId, modelId) {
    const user = getUserById(userId);
    if (!user) throw new Error("User not found.");
    user.favouriteModelIds = user.favouriteModelIds.filter((id) => id !== modelId);
    return user;
}
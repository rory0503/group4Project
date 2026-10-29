'use strict';

// userInformation.js
import { models } from "./models.js";
import { Check, Download, User, Sprout, BookOpen, Droplet, Zap, Cloud, Mail, Phone } from "lucide-react";

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

/* information page - all informarion created by AI. I gave it the other webpages 
and info about our website so it could create it for show and inspiration. 
I would rather it was human written so needs done by someone. Feel free to keep
the layout it created as it look nice and ties in the with css but if you feel it could 
be improved then change it */

// The three metrics we track. `color` is the name of a CSS variable from styles.css.
export const metricCards = [
  { key: "water", color: "--water", icon: Droplet, title: "Water", text: "Litres used, mostly for data-centre cooling" },
  { key: "energy", color: "--energy", icon: Zap, title: "Energy", text: "Electricity in gigawatt-hours (GWh)" },
  { key: "co2", color: "--co2", icon: Cloud, title: "CO₂", text: "Emissions in metric tonnes" },
];

export const aims = [
  { icon: Check, title: "Consistency", text: "Information is formatted the same way everywhere, so it's easy to read." },
  { icon: Download, title: "Availability", text: "All data can be exported to CSV files." },
  { icon: User, title: "Accessibility", text: "Non-technical users can complete tasks on the site easily." },
  { icon: Sprout, title: "Usability", text: "The interface lets people do what they need, when they need to." },
  { icon: BookOpen, title: "Accuracy", text: "We present accurate, sourced data to users." },
];

export const scoreBands = [
  { range: "25 – 30", label: "Low impact" },
  { range: "18 – 24", label: "Moderate impact" },
  { range: "0 – 17", label: "High impact" },
];

export const sources = [
  { title: "Power Hungry Processing: Watts Driving the Cost of AI Deployment?", url: "https://arxiv.org/abs/2311.16863", meta: "Luccioni, Jernite & Strubell · ACM FAccT, 2024" },
  { title: 'Making AI Less "Thirsty": Uncovering and Addressing the Secret Water Footprint of AI Models', url: "https://arxiv.org/abs/2304.03271", meta: "Li, Yang, Islam & Ren · 2023" },
  { title: "Carbon Emissions and Large Neural Network Training", url: "https://arxiv.org/abs/2104.10350", meta: "Patterson et al. · 2021" },
  { title: "Energy and Policy Considerations for Deep Learning in NLP", url: "https://arxiv.org/abs/1906.02243", meta: "Strubell, Ganesh & McCallum · ACL, 2019" },
  { title: "Energy and AI", url: "https://www.iea.org/reports/energy-and-ai", meta: "International Energy Agency · 2025" },
];

export const contact = [
  { icon: Mail, label: "Email", value: "contact@email.com", href: "mailto:contact@email.com" },
  { icon: Phone, label: "Contact number", value: "+44 755-2995", href: "tel:+447552995" },
];
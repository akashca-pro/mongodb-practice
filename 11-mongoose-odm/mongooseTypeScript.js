/**
 * TOPIC: MONGOOSE WITH TYPESCRIPT
 * DESCRIPTION:
 * Type-safe Mongoose schemas and models using TypeScript.
 * Proper typing for documents, queries, and methods.
 */

// Note: This file demonstrates TypeScript patterns
// In a real project, rename to .ts and configure TypeScript

// -------------------------------------------------------------------------------------------
// 1. INTERFACE DEFINITIONS
// -------------------------------------------------------------------------------------------

/**
 * TypeScript interfaces for MongoDB documents:
 * 
 * interface IUser {
 *     name: string;
 *     email: string;
 *     age?: number;
 *     role: 'user' | 'admin';
 *     createdAt: Date;
 * }
 * 
 * // For document methods
 * interface IUserMethods {
 *     getFullName(): string;
 *     isAdmin(): boolean;
 * }
 * 
 * // For model statics
 * interface UserModel extends Model<IUser, {}, IUserMethods> {
 *     findByEmail(email: string): Promise<HydratedDocument<IUser, IUserMethods>>;
 * }
 */

// -------------------------------------------------------------------------------------------
// 2. TYPED SCHEMA
// -------------------------------------------------------------------------------------------

const typedSchemaExample = `
import { Schema, model, Model, HydratedDocument } from 'mongoose';

// Document interface
interface IUser {
    name: string;
    email: string;
    age?: number;
    role: 'user' | 'admin';
    createdAt: Date;
}

// Instance methods
interface IUserMethods {
    getFullName(): string;
}

// Model type with methods
type UserModel = Model<IUser, {}, IUserMethods>;

// Schema with types
const userSchema = new Schema<IUser, UserModel, IUserMethods>({
    name: { type: String, required: true },
    email: { type: String, required: true },
    age: Number,
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    createdAt: { type: Date, default: Date.now }
});

// Add instance method
userSchema.methods.getFullName = function() {
    return this.name.toUpperCase();
};

// Create model
const User = model<IUser, UserModel>('User', userSchema);
`;

// -------------------------------------------------------------------------------------------
// 3. STATIC METHODS
// -------------------------------------------------------------------------------------------

const staticMethodsExample = `
interface IUser {
    name: string;
    email: string;
    status: 'active' | 'inactive';
}

interface IUserMethods {
    activate(): Promise<void>;
}

interface UserModel extends Model<IUser, {}, IUserMethods> {
    findByEmail(email: string): Promise<HydratedDocument<IUser, IUserMethods> | null>;
    findActive(): Promise<HydratedDocument<IUser, IUserMethods>[]>;
}

const userSchema = new Schema<IUser, UserModel, IUserMethods>({
    name: String,
    email: String,
    status: String
});

// Static method
userSchema.statics.findByEmail = function(email: string) {
    return this.findOne({ email });
};

userSchema.statics.findActive = function() {
    return this.find({ status: 'active' });
};

const User = model<IUser, UserModel>('User', userSchema);

// Usage
const user = await User.findByEmail('test@example.com');
const activeUsers = await User.findActive();
`;

// -------------------------------------------------------------------------------------------
// 4. VIRTUALS WITH TYPES
// -------------------------------------------------------------------------------------------

const virtualsExample = `
interface IUser {
    firstName: string;
    lastName: string;
}

interface IUserVirtuals {
    fullName: string;
}

type UserDocument = HydratedDocument<IUser, {}, IUserVirtuals>;

const userSchema = new Schema<IUser, Model<IUser>, {}, {}, IUserVirtuals>({
    firstName: String,
    lastName: String
});

userSchema.virtual('fullName').get(function() {
    return \`\${this.firstName} \${this.lastName}\`;
});

const User = model<IUser>('User', userSchema);

const user = await User.findOne();
console.log(user?.fullName);  // Typed as string
`;

// -------------------------------------------------------------------------------------------
// 5. QUERY HELPERS WITH TYPES
// -------------------------------------------------------------------------------------------

const queryHelpersExample = `
interface IOrder {
    status: string;
    total: number;
    createdAt: Date;
}

interface OrderQueryHelpers {
    completed(): QueryWithHelpers<
        HydratedDocument<IOrder>[],
        HydratedDocument<IOrder>,
        OrderQueryHelpers
    >;
    highValue(min: number): QueryWithHelpers<
        HydratedDocument<IOrder>[],
        HydratedDocument<IOrder>,
        OrderQueryHelpers
    >;
}

const orderSchema = new Schema<IOrder, Model<IOrder, OrderQueryHelpers>, {}, OrderQueryHelpers>({
    status: String,
    total: Number,
    createdAt: Date
});

orderSchema.query.completed = function() {
    return this.where({ status: 'completed' });
};

orderSchema.query.highValue = function(min: number) {
    return this.where({ total: { $gte: min } });
};

const Order = model<IOrder, Model<IOrder, OrderQueryHelpers>>('Order', orderSchema);

// Chained with type safety
const orders = await Order.find().completed().highValue(100);
`;

// -------------------------------------------------------------------------------------------
// 6. LEAN DOCUMENTS
// -------------------------------------------------------------------------------------------

const leanExample = `
interface IUser {
    name: string;
    email: string;
}

const User = model<IUser>('User', schema);

// lean() returns plain objects
const users: IUser[] = await User.find().lean();

// No Mongoose methods available
// users[0].save()  // Error: Property 'save' does not exist

// With lean and virtuals
const withVirtuals = await User.find().lean({ virtuals: true });
`;

// -------------------------------------------------------------------------------------------
// SUMMARY & BEST PRACTICES
// -------------------------------------------------------------------------------------------

/**
 * TYPESCRIPT + MONGOOSE:
 * 
 * 1. Define document interface (IUser)
 * 2. Define methods interface (IUserMethods)
 * 3. Define model interface (UserModel)
 * 4. Use generics in Schema and model()
 * 
 * BEST PRACTICES:
 * - Separate interfaces for different concerns
 * - Use HydratedDocument for document types
 * - Type static methods in model interface
 * - Use lean() for plain object types
 */

module.exports = {
    typedSchemaExample,
    staticMethodsExample,
    virtualsExample,
    queryHelpersExample,
    leanExample
};

export declare enum Role {
    ADMIN = "admin",
    STYLIST = "stylist",
    CLIENT = "client"
}
export declare class User {
    id: number;
    email: string;
    passwordHash: string;
    role: Role;
    firstName?: string;
    lastName?: string;
    phone?: string;
    isVerified: boolean;
    verificationToken?: string;
    passwordResetToken?: string;
    passwordResetExpires?: Date;
    refreshTokenHash?: string;
    lastLoginAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

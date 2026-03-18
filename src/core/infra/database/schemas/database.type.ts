export enum EAuthProviders {
	LOCAL = "local",
	GOOGLE = "google",
	GITHUB = "github",
}
export const AuthProviders = Object.values(EAuthProviders) as [string, ...string[]];

export enum EAccountStatus {
	ACTIVE = "active",
	SUSPENDED = "suspended",
	DEACTIVATED = "deactivated",
}
export const AccountStatus = Object.values(EAccountStatus) as [string, ...string[]];

export enum EOrganizationTypes {
	COMPANY = "company",
	STARTUP = "startup",
	ASSOCIATION = "association",
	COMMUNITY = "community",
	FREELANCE = "freelance",
	SCHOOL = "school",
	OTHER = "other",
}
export const OrganizationTypes = Object.values(EOrganizationTypes) as [string, ...string[]];

export enum EOrganizationStatus {
	ACTIVE = "active",
	SUSPENDED = "suspended",
	DEACTIVATED = "deactivated",
	BANNED = "banned",
}
export const OrganizationStatus = Object.values(EOrganizationStatus) as [string, ...string[]];

export enum EActorTypes {
	USER = "user",
	ORGANIZATION = "organization",
}
export const ActorTypes = Object.values(EActorTypes) as [EActorTypes, ...EActorTypes[]];

export enum ESessionStatus {
	ACTIVE = "active",
	EXPIRED = "expired",
	REVOKED = "revoked",
}
export const SessionStatus = Object.values(ESessionStatus) as [string, ...string[]];

export enum ESkillTypes {
	TECHNICAL = "technical",
	HARD = "hard",
	SOFT = "soft",
	OTHER = "other",
}
export const SkillTypes = Object.values(ESkillTypes) as [string, ...string[]];

export enum EEvidenceTypes {
	IMAGES = "images",
	VIDEOS = "videos",
	DOCUMENTS = "documents",
	OTHER = "other",
}
export const EvidenceTypes = Object.values(EEvidenceTypes) as [string, ...string[]];

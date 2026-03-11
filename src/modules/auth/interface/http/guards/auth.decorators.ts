import { createParamDecorator, ExecutionContext, SetMetadata } from "@nestjs/common";
import type { Request } from "express";

export const IS_PUBLIC_KEY = "auth:isPublic";
export const IS_OPTIONAL_AUTH_KEY = "auth:isOptionalAuth";

export const AuthPublic = () => SetMetadata(IS_PUBLIC_KEY, true);

export const AuthOptional = () => SetMetadata(IS_OPTIONAL_AUTH_KEY, true);

function getReq(ctx: ExecutionContext) {
	return ctx.switchToHttp().getRequest<Request>();
}

// get all auth context from request from cookies
export const Auth = createParamDecorator((_data: unknown, ctx: ExecutionContext) => getReq(ctx).auth);

// get user id from auth context
export const UserId = createParamDecorator((_data: unknown, ctx: ExecutionContext) => getReq(ctx).auth?.userId);

// get account id from auth context
export const AccountId = createParamDecorator((_data: unknown, ctx: ExecutionContext) => getReq(ctx).auth?.accountId);

// get actor id from auth context
export const ActorId = createParamDecorator((_data: unknown, ctx: ExecutionContext) => getReq(ctx).auth?.actorId);

// get session id from auth context
export const SessionId = createParamDecorator((_data: unknown, ctx: ExecutionContext) => getReq(ctx).auth?.sessionId);

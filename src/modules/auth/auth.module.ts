import { jwtConfig } from "@apk_core/config";
import { TJwtConfig } from "@apk_core/config/root.config";
import { ActorsRepoAuthDrizzleAdapter } from "@apk_modules/user/infra/adapters/actors-repo-auth.drizzle.adapter";
import { UserModule } from "@apk_modules/user/user.module";
import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { JwtModule } from "@nestjs/jwt";
import { CompleteRegisterCommandHandler } from "./application/commands/complete-register.command";
import { LoginCommandHandler } from "./application/commands/login.command";
import { LogoutCommandHandler } from "./application/commands/logout.command";
import { RefreshAccessTokenCommandHandler } from "./application/commands/refresh-access-token.command";
import { RequestRegisterCommandHandler } from "./application/commands/request-register.command";
import { VerifyTokenEmailRegisterCommandHandler } from "./application/commands/verify-token-email-register.command";
import { AccountsRepoAuthPort } from "./application/ports/accounts-repo-auth.port";
import { ActorsRepoAuthPort } from "./application/ports/actors-repo-auth.port";
import { BoxMailerPort } from "./application/ports/box-mailer.port";
import { EncryptionDecryptionPort } from "./application/ports/encryption-decryption.port";
import { PasswordHasherPort } from "./application/ports/password-hasher.port";
import { RegisterCooldownPort } from "./application/ports/register-cooldown.port";
import { RegistrationsRepoAuthPort } from "./application/ports/registrations-repo-auth.port";
import { SessionsCachePort } from "./application/ports/sessions-cache.port";
import { SessionsRepoAuthPort } from "./application/ports/sessions-repo-auth.port";
import { TokenizerPort } from "./application/ports/tokenizer.port";
import { RegisterTokenValidatorService } from "./application/services/register-token-validator.service";
import { RequestAuthResolverService } from "./application/services/request-auth-resolver.service";
import { AccountsRepoDrizzleAdapter } from "./infra/adapters/accounts-repo-auth.drizzle.adapter";
import { BoxMailerNodemailerAdapter } from "./infra/adapters/box-mailer.nodemailer";
import { EncryptionDecryptionCryptoAdapter } from "./infra/adapters/encryption-decryption.crypto.adapter";
import { PasswordHasherBcryptAdapter } from "./infra/adapters/password-hasher.bcrypt.adapter";
import { RegisterCooldownRedisAdapter } from "./infra/adapters/register-cooldown.redis.adapter";
import { RegistrationsRepoAuthDrizzleAdapter } from "./infra/adapters/registrations-repo-auth.drizzle.adapter";
import { SessionCacheRedisAdapter } from "./infra/adapters/session-cache.redis.adapter";
import { SessionsRepoAuthDrizzleAdapter } from "./infra/adapters/sessions-repo-auth.drizzle.adapter";
import { TokenizerJwtAdapter } from "./infra/adapters/tokenizer.jwt.adapter";
import { AuthController } from "./interface/http/controllers/auth.controller";
import { JwtAuthGuard } from "./interface/http/guards/jwt-auth-cookie.guard";
import { JwtCookieStrategy } from "./interface/http/strategies/jwt-cookie.strategy";

const adapters = [
	{ provide: RegisterCooldownPort, useClass: RegisterCooldownRedisAdapter },
	{ provide: EncryptionDecryptionPort, useClass: EncryptionDecryptionCryptoAdapter },
	{ provide: RegistrationsRepoAuthPort, useClass: RegistrationsRepoAuthDrizzleAdapter },
	{ provide: BoxMailerPort, useClass: BoxMailerNodemailerAdapter },
	{ provide: PasswordHasherPort, useClass: PasswordHasherBcryptAdapter },
	{ provide: AccountsRepoAuthPort, useClass: AccountsRepoDrizzleAdapter },
	{ provide: ActorsRepoAuthPort, useClass: ActorsRepoAuthDrizzleAdapter },
	{ provide: TokenizerPort, useClass: TokenizerJwtAdapter },
	{ provide: SessionsRepoAuthPort, useClass: SessionsRepoAuthDrizzleAdapter },
	{ provide: SessionsCachePort, useClass: SessionCacheRedisAdapter },
];

const commands = [
	RequestRegisterCommandHandler,
	VerifyTokenEmailRegisterCommandHandler,
	CompleteRegisterCommandHandler,
	LoginCommandHandler,
	LogoutCommandHandler,
	RefreshAccessTokenCommandHandler,
];

@Module({
	imports: [
		CqrsModule,
		UserModule,
		JwtModule.registerAsync({
			inject: [jwtConfig.KEY],
			useFactory: (jwtCfg: TJwtConfig) => ({
				secret: jwtCfg.accessTokenSecret,
				signOptions: { expiresIn: jwtCfg.accessTokenTtlSec },
			}),
		}),
	],
	providers: [
		...adapters,
		...commands,
		RegisterTokenValidatorService,
		RequestAuthResolverService,
		JwtCookieStrategy,
		JwtAuthGuard,
	],
	controllers: [AuthController],
	exports: [JwtAuthGuard],
})
export class AuthModule {}

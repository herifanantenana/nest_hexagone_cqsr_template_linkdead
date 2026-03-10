import { UserModule } from "@apk_modules/user/user.module";
import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { RequestRegisterCommandHandler } from "./application/commands/request-register.command";
import { BoxMailerPort } from "./application/ports/box-mailer.port";
import { EncryptionDecryptionPort } from "./application/ports/encryption-decryption.port";
import { RegisterCooldownPort } from "./application/ports/register-cooldown.port";
import { RegistrationsRepoAuthPort } from "./application/ports/registrations-repo-auth.port";
import { BoxMailerNodemailerAdapter } from "./infra/adapters/box-mailer.nodemailer";
import { EncryptionDecryptionCryptoAdapter } from "./infra/adapters/encryption-decryption.crypto.adapter";
import { RegisterCooldownRedisAdapter } from "./infra/adapters/register-cooldown.redis.adapter";
import { RegistrationsRepoAuthDrizzleAdapter } from "./infra/adapters/registrations-repo-auth.drizzle.adapter";
import { AuthController } from "./interface/http/controllers/auth.controller";

const adapters = [
	{ provide: RegisterCooldownPort, useClass: RegisterCooldownRedisAdapter },
	{ provide: EncryptionDecryptionPort, useClass: EncryptionDecryptionCryptoAdapter },
	{ provide: RegistrationsRepoAuthPort, useClass: RegistrationsRepoAuthDrizzleAdapter },
	{ provide: BoxMailerPort, useClass: BoxMailerNodemailerAdapter },
];

const commands = [RequestRegisterCommandHandler];

@Module({
	imports: [CqrsModule, UserModule],
	providers: [...adapters, ...commands],
	controllers: [AuthController],
})
export class AuthModule {}

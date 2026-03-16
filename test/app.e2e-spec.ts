import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";
import { App } from "supertest/types";
import { AppController } from "./../src/app.controller";
import { AppService } from "./../src/app.service";

describe("AppController (e2e)", () => {
	let app: INestApplication<App>;
	let consoleSpy: jest.SpyInstance;

	beforeEach(async () => {
		consoleSpy = jest.spyOn(console, "log").mockImplementation(() => undefined);

		const moduleFixture: TestingModule = await Test.createTestingModule({
			controllers: [AppController],
			providers: [
				{
					provide: AppService,
					useValue: {
						getHello: () => "Hello World!",
					},
				},
			],
		}).compile();

		app = moduleFixture.createNestApplication();
		await app.init();
	});

	afterEach(async () => {
		consoleSpy?.mockRestore();
		await app?.close();
	});

	it("/ (GET)", () => request(app.getHttpServer()).get("/").expect(200).expect("Hello World!"));
});

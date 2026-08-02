/**
 * @typedef {import('typeorm').MigrationInterface} MigrationInterface
 * @typedef {import('typeorm').QueryRunner} QueryRunner
 */

/**
 * @class
 * @implements {MigrationInterface}
 */
module.exports = class Init1785648618769 {
    name = 'Init1785648618769'

    /**
     * @param {QueryRunner} queryRunner
     */
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "categories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" citext NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_8b0be371d28245da6e4f4b61878" UNIQUE ("name"), CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "shared_photos" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "unsplash_id" character varying(100) NOT NULL, "unsplash_page_url" character varying(2048) NOT NULL, "image_url" character varying(2048) NOT NULL, "photographer_name" character varying(50) NOT NULL, "photographer_url" character varying(2048) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_834d3f830075d397cefe5c4d099" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "shared_photo_categories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "category_id" uuid NOT NULL, "shared_photo_id" uuid NOT NULL, CONSTRAINT "PK_4f15071b3d6eb938eace537f12c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "shared_photo_categories" ADD CONSTRAINT "FK_b9ca8c825dcd5bd0dbe750e87df" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "shared_photo_categories" ADD CONSTRAINT "FK_cdcf6fdf06dd24c606b1d4d6987" FOREIGN KEY ("shared_photo_id") REFERENCES "shared_photos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    /**
     * @param {QueryRunner} queryRunner
     */
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "shared_photo_categories" DROP CONSTRAINT "FK_cdcf6fdf06dd24c606b1d4d6987"`);
        await queryRunner.query(`ALTER TABLE "shared_photo_categories" DROP CONSTRAINT "FK_b9ca8c825dcd5bd0dbe750e87df"`);
        await queryRunner.query(`DROP TABLE "shared_photo_categories"`);
        await queryRunner.query(`DROP TABLE "shared_photos"`);
        await queryRunner.query(`DROP TABLE "categories"`);
    }
}

/**
 * @typedef {import('typeorm').MigrationInterface} MigrationInterface
 * @typedef {import('typeorm').QueryRunner} QueryRunner
 */

/**
 * @class
 * @implements {MigrationInterface}
 */
module.exports = class AddDeletedSharedPhotosTable1790056394255 {
    name = 'AddDeletedSharedPhotosTable1790056394255'

    /**
     * @param {QueryRunner} queryRunner
     */
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "deleted_shared_photos" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "unsplash_id" character varying(100) NOT NULL, "unsplash_page_url" character varying(2048) NOT NULL, "photographer_name" character varying(50) NOT NULL, "original_sharer_id" uuid NOT NULL, "original_sharer_name" character varying(50) NOT NULL, "deleted_by_admin_id" uuid NOT NULL, "deleted_by_admin_name" character varying(50) NOT NULL, "reason" text, "deleted_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_798bb4d79c7a988025765c7224b" PRIMARY KEY ("id"))`);
    }

    /**
     * @param {QueryRunner} queryRunner
     */
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE "deleted_shared_photos"`);
    }
}

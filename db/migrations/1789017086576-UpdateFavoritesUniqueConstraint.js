/**
 * @typedef {import('typeorm').MigrationInterface} MigrationInterface
 * @typedef {import('typeorm').QueryRunner} QueryRunner
 */

/**
 * @class
 * @implements {MigrationInterface}
 */
module.exports = class UpdateFavoritesUniqueConstraint1789017086576 {
    name = 'UpdateFavoritesUniqueConstraint1789017086576'

    /**
     * @param {QueryRunner} queryRunner
     */
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "favorites" DROP CONSTRAINT "UQ_6b29d7dd1d5ff33f9a9a8ac835e"`);
        await queryRunner.query(`ALTER TABLE "favorites" ADD CONSTRAINT "UQ_ae2e49a05034750fdea5b455a54" UNIQUE ("user_id", "collection_id", "shared_photo_id")`);
    }

    /**
     * @param {QueryRunner} queryRunner
     */
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "favorites" DROP CONSTRAINT "UQ_ae2e49a05034750fdea5b455a54"`);
        await queryRunner.query(`ALTER TABLE "favorites" ADD CONSTRAINT "UQ_6b29d7dd1d5ff33f9a9a8ac835e" UNIQUE ("user_id", "shared_photo_id")`);
    }
}

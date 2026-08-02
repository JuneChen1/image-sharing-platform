/**
 * @typedef {import('typeorm').MigrationInterface} MigrationInterface
 * @typedef {import('typeorm').QueryRunner} QueryRunner
 */

/**
 * @class
 * @implements {MigrationInterface}
 */
module.exports = class AddUQPairInSharedPhotoCategories1785649053682 {
    name = 'AddUQPairInSharedPhotoCategories1785649053682'

    /**
     * @param {QueryRunner} queryRunner
     */
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "shared_photo_categories" ADD CONSTRAINT "UQ_shared_photo_categories_pair" UNIQUE ("category_id", "shared_photo_id")`);
    }

    /**
     * @param {QueryRunner} queryRunner
     */
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "shared_photo_categories" DROP CONSTRAINT "UQ_shared_photo_categories_pair"`);
    }
}

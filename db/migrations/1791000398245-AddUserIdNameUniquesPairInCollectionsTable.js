/**
 * @typedef {import('typeorm').MigrationInterface} MigrationInterface
 * @typedef {import('typeorm').QueryRunner} QueryRunner
 */

/**
 * @class
 * @implements {MigrationInterface}
 */
module.exports = class AddUserIdNameUniquesPairInCollectionsTable1791000398245 {
    name = 'AddUserIdNameUniquesPairInCollectionsTable1791000398245'

    /**
     * @param {QueryRunner} queryRunner
     */
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "collections" ADD CONSTRAINT "UQ_user_id_name_pair" UNIQUE ("name", "user_id")`);
    }

    /**
     * @param {QueryRunner} queryRunner
     */
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "collections" DROP CONSTRAINT "UQ_user_id_name_pair"`);
    }
}

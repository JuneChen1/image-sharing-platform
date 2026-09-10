/**
 * @typedef {import('typeorm').MigrationInterface} MigrationInterface
 * @typedef {import('typeorm').QueryRunner} QueryRunner
 */

/**
 * @class
 * @implements {MigrationInterface}
 */
module.exports = class SetNullOnFavoritesCollectionWhenDelete1789014810482 {
    name = 'SetNullOnFavoritesCollectionWhenDelete1789014810482'

    /**
     * @param {QueryRunner} queryRunner
     */
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "favorites" DROP CONSTRAINT "FK_2faa572fc74d81a34a89e002ea7"`);
        await queryRunner.query(`ALTER TABLE "favorites" ADD CONSTRAINT "FK_2faa572fc74d81a34a89e002ea7" FOREIGN KEY ("collection_id") REFERENCES "collections"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    /**
     * @param {QueryRunner} queryRunner
     */
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "favorites" DROP CONSTRAINT "FK_2faa572fc74d81a34a89e002ea7"`);
        await queryRunner.query(`ALTER TABLE "favorites" ADD CONSTRAINT "FK_2faa572fc74d81a34a89e002ea7" FOREIGN KEY ("collection_id") REFERENCES "collections"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }
}

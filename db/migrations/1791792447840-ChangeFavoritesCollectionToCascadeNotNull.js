/**
 * @typedef {import('typeorm').MigrationInterface} MigrationInterface
 * @typedef {import('typeorm').QueryRunner} QueryRunner
 */

/**
 * @class
 * @implements {MigrationInterface}
 */
module.exports = class ChangeFavoritesCollectionToCascadeNotNull1791792447840 {
    name = 'ChangeFavoritesCollectionToCascadeNotNull1791792447840'

    /**
     * @param {QueryRunner} queryRunner
     */
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "favorites" DROP CONSTRAINT "FK_2faa572fc74d81a34a89e002ea7"`);
        await queryRunner.query(`ALTER TABLE "favorites" DROP CONSTRAINT "UQ_ae2e49a05034750fdea5b455a54"`);
        await queryRunner.query(`ALTER TABLE "favorites" ALTER COLUMN "collection_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "favorites" ADD CONSTRAINT "UQ_ae2e49a05034750fdea5b455a54" UNIQUE ("user_id", "collection_id", "shared_photo_id")`);
        await queryRunner.query(`ALTER TABLE "favorites" ADD CONSTRAINT "FK_2faa572fc74d81a34a89e002ea7" FOREIGN KEY ("collection_id") REFERENCES "collections"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    /**
     * @param {QueryRunner} queryRunner
     */
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "favorites" DROP CONSTRAINT "FK_2faa572fc74d81a34a89e002ea7"`);
        await queryRunner.query(`ALTER TABLE "favorites" DROP CONSTRAINT "UQ_ae2e49a05034750fdea5b455a54"`);
        await queryRunner.query(`ALTER TABLE "favorites" ALTER COLUMN "collection_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "favorites" ADD CONSTRAINT "UQ_ae2e49a05034750fdea5b455a54" UNIQUE ("user_id", "collection_id", "shared_photo_id")`);
        await queryRunner.query(`ALTER TABLE "favorites" ADD CONSTRAINT "FK_2faa572fc74d81a34a89e002ea7" FOREIGN KEY ("collection_id") REFERENCES "collections"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }
}

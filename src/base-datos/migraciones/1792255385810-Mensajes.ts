import { MigrationInterface, QueryRunner } from "typeorm";

export class Mensajes1792255385810 implements MigrationInterface {
    name = 'Mensajes1792255385810'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "mensajes" ("id" SERIAL NOT NULL, "sesion" character varying(60) NOT NULL, "rol" character varying(10) NOT NULL, "contenido" text NOT NULL, "creado_en" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "usuario_id" uuid NOT NULL, CONSTRAINT "PK_20c919d08249bb93d84ce01beb4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_895b91cbb9a2aec5605824f4fa" ON "mensajes"  ("usuario_id", "sesion", "creado_en") `);
        await queryRunner.query(`ALTER TABLE "mensajes" ADD CONSTRAINT "FK_b54437b6a7023ab7f977279dbc1" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "mensajes" DROP CONSTRAINT "FK_b54437b6a7023ab7f977279dbc1"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_895b91cbb9a2aec5605824f4fa"`);
        await queryRunner.query(`DROP TABLE "mensajes"`);
    }

}

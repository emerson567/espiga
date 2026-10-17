import { MigrationInterface, QueryRunner } from "typeorm";

export class Pedidos1792255276924 implements MigrationInterface {
    name = 'Pedidos1792255276924'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."pedidos_estado_enum" AS ENUM('recibido', 'preparando', 'despachado', 'entregado', 'cancelado')`);
        await queryRunner.query(`CREATE TABLE "pedidos" ("id" SERIAL NOT NULL, "origen" character varying(10) NOT NULL, "domicilio" boolean NOT NULL, "direccion" character varying(200) NOT NULL DEFAULT '', "total" integer NOT NULL, "estado" "public"."pedidos_estado_enum" NOT NULL DEFAULT 'recibido', "creado_en" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "usuario_id" uuid NOT NULL, CONSTRAINT "PK_ebb5680ed29a24efdc586846725" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "pedido_items" ("id" SERIAL NOT NULL, "cantidad" integer NOT NULL, "precio_unitario" integer NOT NULL, "subtotal" integer NOT NULL, "pedido_id" integer NOT NULL, "producto_id" character varying(40) NOT NULL, CONSTRAINT "PK_f8fa1d930ff13073bc34571ba9d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "pedidos" ADD CONSTRAINT "FK_44db92bd8242455d454c1d2c5d9" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "pedido_items" ADD CONSTRAINT "FK_8b8ebfbaf432feb890739eb925c" FOREIGN KEY ("pedido_id") REFERENCES "pedidos"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "pedido_items" ADD CONSTRAINT "FK_04788d698de3fb142193147b9d4" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pedido_items" DROP CONSTRAINT "FK_04788d698de3fb142193147b9d4"`);
        await queryRunner.query(`ALTER TABLE "pedido_items" DROP CONSTRAINT "FK_8b8ebfbaf432feb890739eb925c"`);
        await queryRunner.query(`ALTER TABLE "pedidos" DROP CONSTRAINT "FK_44db92bd8242455d454c1d2c5d9"`);
        await queryRunner.query(`DROP TABLE "pedido_items"`);
        await queryRunner.query(`DROP TABLE "pedidos"`);
        await queryRunner.query(`DROP TYPE "public"."pedidos_estado_enum"`);
    }

}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { ESTADOS } from './pedido.entity.js';
import type { Estado } from './pedido.entity.js';

export class ItemDto {
  @ApiProperty({ example: 'pandebono' })
  @IsString()
  @Length(1, 100)
  producto: string;

  @ApiProperty({ example: 10 })
  @IsInt()
  @Min(1)
  @Max(200)
  cantidad: number;
}

// El cliente no va en el cuerpo: sale del token. Nadie puede pedir a nombre de otro.
export class CrearPedidoDto {
  @ApiProperty({ type: [ItemDto] })
  @IsArray()
  @ArrayMinSize(1, { message: 'El pedido no tiene productos' })
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => ItemDto)
  items: ItemDto[];

  @ApiProperty()
  @IsBoolean()
  domicilio: boolean;

  @ApiPropertyOptional({ example: 'Carrera 4 # 6-21' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  direccion?: string;
}

export class CambiarEstadoDto {
  @ApiProperty({ enum: ESTADOS })
  @IsIn(ESTADOS, { message: `El estado debe ser uno de: ${ESTADOS.join(', ')}` })
  estado: Estado;
}

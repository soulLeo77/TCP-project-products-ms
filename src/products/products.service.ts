import { HttpStatus, Injectable } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaService } from 'src/prisma.service';
import { PaginationDto } from 'src/common';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  create(createProductDto: CreateProductDto) {
    return this.prisma.product.create({
      data: createProductDto
    }); 
  }

  async findAll( paginationDto: PaginationDto ) {
    const { page = 1, limit = 10 } = paginationDto;
    const totalItems = await this.prisma.product.count({ where: { available: true } })
    const totalPages = Math.ceil(totalItems / limit);

    return {
        data: await this.prisma.product.findMany({
        skip: (page - 1) * limit,
        take: limit,
        where: { available: true },
      }),
      meta: {
        total: totalItems,
        page: page,
        last_page: totalPages,
      }
    }
  }

  async findOne(id: number) {
    const product = await this.prisma.product.findFirst({
      where: { id, available: true },
    });

    if ( !product ) {
      throw new RpcException({
        message: `Product with id #${id} not found`,
        status: HttpStatus.BAD_REQUEST,
      });
    }

    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto) {

    const { id: _, ...data} = updateProductDto;

    await this.findOne(id);

    return this.prisma.product.update({
      where: { id },
      data: data,
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    // return this.prisma.product.delete({
    //   where: { id }
    // });

    const product = await this.prisma.product.update({
      where: { id },
      data: { available: false },
    });

    return product;
  }
}

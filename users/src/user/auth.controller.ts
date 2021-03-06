import { TokenService } from './token.service';
import {
  BadRequestException,
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  NotFoundException,
  Post,
  Put,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { RegisterDto } from './dtos/register.dto';
import { UserService } from '../user/user.service';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { Response, Request } from 'express';
//import {AuthGuard} from "./auth.guard";

@Controller()
@UseInterceptors(ClassSerializerInterceptor)
export class AuthController {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private tokenService: TokenService,
  ) {}

  @Post('/register')
  async register(@Body() body: RegisterDto, @Req() request: Request) {
    const { password_confirm, ...data } = body;

    if (body.password !== password_confirm) {
      throw new BadRequestException('Passwords do not match!');
    }

    const hashed = await bcrypt.hash(body.password, 12);

    return this.userService.save({
      ...data,
      password: hashed,
      is_ambassador: request.path === '/api/ambassador/register',
    });
  }
  @Post('/login')
  async login(
    @Body('email') email: string,
    @Body('password') password: string,
    @Body('scope') scope: string,
    @Res({ passthrough: true }) response: Response,
    @Req() request: Request,
  ) {
    const user = await this.userService.findOne({ email });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!(await bcrypt.compare(password, user.password))) {
      throw new BadRequestException('Invalid credentials');
    }

    console.log({ scope });
    const jwt = await this.jwtService.signAsync({
      id: user.id,
      scope,
    });

    await this.tokenService.save({
      user_id: user.id,
      token: jwt,
      created_at: new Date(),
      expired_at: new Date(new Date().getTime() + 1000 * 60 * 60 * 24), // 1 day
    });

    return {
      jwt,
    };
  }

  //@UseGuards(AuthGuard)
  @Get('user')
  async user(@Req() request: Request) {
    const cookie = request.cookies['jwt'];

    const { id } = await this.jwtService.verifyAsync(cookie);
    return this.userService.findOne({ id });
  }

  @UseGuards(AuthGuard)
  @Post('/logout')
  async logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie('jwt');

    // await this.tokenService.delete({ id });
    return {
      message: 'success',
    };
  }
  /* 

    //@UseGuards(AuthGuard)
    @Put(['admin/users/info', 'ambassador/users/info'])
    async updateInfo(
        @Req() request: Request,
        @Body('first_name') first_name: string,
        @Body('last_name') last_name: string,
        @Body('email') email: string,
    ) {
        const cookie = request.cookies['jwt'];

        const {id} = await this.jwtService.verifyAsync(cookie);

        await this.userService.update(id, {
            first_name,
            last_name,
            email
        })

        return this.userService.findOne({id});
    }

    //@UseGuards(AuthGuard)
    @Put(['admin/users/password', 'ambassador/users/password'])
    async updatePassword(
        @Req() request: Request,
        @Body('password') password: string,
        @Body('password_confirm') password_confirm: string,
    ) {
        if (password !== password_confirm) {
            throw new BadRequestException('Passwords do not match!');
        }

        const cookie = request.cookies['jwt'];

        const {id} = await this.jwtService.verifyAsync(cookie);

        await this.userService.update(id, {
            password: await bcrypt.hash(password, 12)
        });

        return this.userService.findOne({id});
    } */
}

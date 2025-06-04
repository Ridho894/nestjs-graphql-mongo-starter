import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UsersService } from './users.service';
import { User } from './schemas/user.schema';
import { SkipThrottle, Throttle } from '@nestjs/throttler';

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => [User], { name: 'users' })
  async findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  // Example of an endpoint that skips rate limiting
  @SkipThrottle()
  @Query(() => String, { name: 'publicUserStats' })
  async getPublicStats(): Promise<string> {
    // Public stats logic would go here
    return JSON.stringify({ totalUsers: 100, activeUsers: 50 });
  }

  // Authentication with default rate limiting
  @Throttle({ default: { limit: 5, ttl: 60 } })
  @Mutation(() => String, { name: 'login' })
  async login(
    @Args('email') email: string,
    @Args('password') password: string,
  ): Promise<string> {
    // Login logic would go here
    return JSON.stringify({ token: 'mock-token', email, password });
  }
}

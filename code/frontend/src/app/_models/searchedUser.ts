import { User } from '../_models/user';

export class SearchUser {
    constructor(public displayName:string,
                public user:User) {
    }
    effectiveDate: Date;
}
import { User } from '../_models/user';
import { SelectItem } from 'primeng/api';

export class SearchUser {
    constructor(public displayName:string,
                public user:User) {
    }
    effectiveDate: SelectItem;
}
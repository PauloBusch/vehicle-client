import { AnnouncementList } from './view-models/announcement-list';
import { IQuery } from 'src/app/shared/handlers/interfaces/query';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IQueryResult } from 'src/app/shared/handlers/results/query-result';
import { toUrl } from 'src/app/shared/content/to-url';
import { EOrder } from 'src/app/shared/enums/order';

export class ListAnnouncement implements IQuery<AnnouncementList[]> {
    public page: number = 1;
    public limit: number = 100;
    public sortColumn: string;
    public sortOrder: EOrder;
    public year: number;
    public includeReserved: boolean;
    public includeSold: boolean;
    public dateSale: Date;
    public brandId: string;
    public modelId: string;
    public colorId: string;

    execute(http: HttpClient, apiUrl: string): Observable<IQueryResult<AnnouncementList[]>> {
        return http.get<IQueryResult<AnnouncementList[]>>(`${apiUrl}/announcements?${toUrl(this)}`);
    }
}
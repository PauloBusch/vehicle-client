import { IMutation } from 'src/app/shared/handlers/interfaces/mutation';
import { IMutationResult } from 'src/app/shared/handlers/results/mutation-result';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

export class UpdateVechicle implements IMutation {
    public id: string;
    public board: string;
    public year: number;
    public fuelId: string;
    public colorId: string;
    public modelId: string;
    public imageBase64: string;

    execute(http: HttpClient, apiUrl: string): Observable<IMutationResult> {
        return http.put<IMutationResult>(`${apiUrl}/vehicles/${this.id}`, this);
    }
}
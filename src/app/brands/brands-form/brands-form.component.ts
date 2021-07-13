import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { BrandDetail } from '../queries/view-models/brand-detail';
import { Router, ActivatedRoute } from '@angular/router';
import { QueriesHandlerService } from 'src/app/shared/handlers/query-handler-service';
import { MutationsHandlerService } from 'src/app/shared/handlers/mutation-handler-service';
import { SnackService } from 'src/app/shared/services/snack-service';
import { GetBrand } from '../queries/get-brand';
import { NewId } from 'src/app/shared/random/new-id';
import { CreateBrand } from '../mutations/create-brand';
import { UpdateBrand } from '../mutations/update-brand';
import { IMutationResult } from 'src/app/shared/handlers/results/mutation-result';
import { HttpErrorResponse } from '@angular/common/http';
import { EStatusCode } from 'src/app/shared/handlers/enums/status-code';

@Component({
  selector: 'app-brands-form',
  templateUrl: './brands-form.component.html',
  styleUrls: ['./brands-form.component.css']
})
export class BrandsFormComponent implements OnInit {

  form: FormGroup;

  id: string;
  isNew: boolean;
  brand: BrandDetail;

  constructor(
    private router: Router,
    private activeRouter: ActivatedRoute,
    private queriesHandler: QueriesHandlerService,
    private mutationsHandler: MutationsHandlerService,
    private formBuilder: FormBuilder,
    private snackService: SnackService
  ) {
    this.id = this.activeRouter.snapshot.paramMap.get('id');
    this.isNew = !this.id;
    this.form = this.formBuilder.group({
      name: new FormControl('', [Validators.required])
    });
  }

  ngOnInit(): void {
    this.loadBrand();
  }

  loadBrand() {
    if (this.isNew) return;
    const query = new GetBrand(this.id);
    this.queriesHandler.handle(query).subscribe(
      (rs) => this.setData(rs.data),
      () => this.snackService.open('Falha ao carregar marca!')
    );
  }

  setData(brand: BrandDetail) {
    this.brand = brand;
    this.form.patchValue(this.brand);
  }

  save() {
    if (!this.isValidForm()) return;
    const value = this.form.getRawValue();
    if (this.isNew) {
      value.id = NewId();
      const mutation = Object.assign(new CreateBrand(), value);
      this.mutationsHandler.handle(mutation).subscribe(
        () => this.close(),
        (err: HttpErrorResponse) => {
          const result = err.error as IMutationResult;
          const msgDuplicateName = 'Brand with Name already exists';
          if (err.status === EStatusCode.conflict && result.message.indexOf(msgDuplicateName) !== -1)
            return this.snackService.open('Já existe uma marca com este nome!');
          this.snackService.open('Falha ao criar marca!');
        }
      );
    } else {
      value.id = this.id;
      const mutation = Object.assign(new UpdateBrand(), value);
      this.mutationsHandler.handle(mutation).subscribe(
        (rs) => this.close(),
        (err: HttpErrorResponse) => {
          const result = err.error as IMutationResult;
          const msgDuplicateName = 'Brand with Name already exists';
          if (err.status === EStatusCode.conflict && result.message.indexOf(msgDuplicateName) !== -1)
            return this.snackService.open('Já existe uma marca com este nome!');
          this.snackService.open('Falha ao atualizar marca!');
        }
      );
    }
  }

  close() {
    this.router.navigate(['brands']);
  }

  isValidForm(): boolean {
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      this.snackService.open('Existem campos invávlidos!');
      return false;
    }
    return true;
  }

  isValidField(fieldId: string): boolean {
    const control = this.form.controls[fieldId];
    return control.valid || !control.touched;
  }
}

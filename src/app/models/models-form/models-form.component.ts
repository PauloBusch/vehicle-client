import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, FormControl, Validators } from '@angular/forms';
import { SnackService } from 'src/app/shared/services/snack-service';
import { Router, ActivatedRoute } from '@angular/router';
import { ListModels } from '../queries/list-models';
import { QueriesHandlerService } from 'src/app/shared/handlers/query-handler-service';
import { GetModel } from '../queries/get-model';
import { ModelDetail } from '../queries/view-models/model-detail';
import { MutationsHandlerService } from 'src/app/shared/handlers/mutation-handler-service';
import { NewId } from 'src/app/shared/random/new-id';
import { CreateModel } from '../mutations/create-model';
import { UpdateModel } from '../mutations/update-model';
import { IMutationResult } from 'src/app/shared/handlers/results/mutation-result';
import { HttpErrorResponse } from '@angular/common/http';
import { EStatusCode } from 'src/app/shared/handlers/enums/status-code';
import { ListBrands } from 'src/app/brands/queries/list-brands';
import { BrandList } from 'src/app/brands/queries/view-models/brand-list';

@Component({
  selector: 'app-models-form',
  templateUrl: './models-form.component.html',
  styleUrls: ['./models-form.component.css']
})
export class ModelsFormComponent implements OnInit {

  form: FormGroup;

  id: string;
  isNew: boolean;
  model: ModelDetail;

  brands: BrandList[] = [];
  brandName: string;

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
      name: new FormControl('', [Validators.required]),
      brandId: new FormControl('', [Validators.required])
    });
  }

  ngOnInit(): void {
    this.loadSelects();
    this.loadModel();
  }

  loadModel() {
    if (this.isNew) return;
    const query = new GetModel(this.id);
    this.queriesHandler.handle(query).subscribe(
      (rs) => this.setData(rs.data),
      () => this.snackService.open('Falha ao carregar modelo!')
    );
  }

  setData(model: ModelDetail) {
    this.model = model;
    this.form.patchValue(this.model);
    this.brandName = this.model.brandName;
  }

  save() {
    if (!this.isValidForm()) return;
    const value = this.form.getRawValue();
    if (this.isNew) {
      value.id = NewId();
      const mutation = Object.assign(new CreateModel(), value);
      this.mutationsHandler.handle(mutation).subscribe(
        (rs) => this.close(),
        (err: HttpErrorResponse) => {
          const result = err.error as IMutationResult;
          const msgDuplicateName = 'Model with Name already exists';
          if (err.status === EStatusCode.conflict && result.message.indexOf(msgDuplicateName) !== -1)
            return this.snackService.open('Já existe um modelo com este nome!');
          this.snackService.open('Falha ao criar modelo!');
        }
      );
    } else {
      value.id = this.id;
      const mutation = Object.assign(new UpdateModel(), value);
      this.mutationsHandler.handle(mutation).subscribe(
        (rs) => this.close(),
        (err: HttpErrorResponse) => {
          const result = err.error as IMutationResult;
          const msgDuplicateName = 'Model with Name already exists';
          if (err.status === EStatusCode.conflict && result.message.indexOf(msgDuplicateName) !== -1)
            return this.snackService.open('Já existe um modelo com este nome!');
          this.snackService.open('Falha ao atualizar modelo!');
        }
      );
    }
  }

  close() {
    this.router.navigate(['models']);
  }

  onSelect(valueId: string, fieldId: string): void {
    const control = this.form.controls[fieldId];
    control.setValue(valueId);
    control.updateValueAndValidity();
    this.form.markAsDirty();
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

  loadSelects() {
    const listBrands = new ListBrands();
    this.queriesHandler.handle(listBrands).subscribe(
      (rs) => this.brands = rs.data,
      ()  => this.snackService.open('Falha ao carregar marcas de veículos!'));
  }
}

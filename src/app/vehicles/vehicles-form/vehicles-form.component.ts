import { Component, OnInit } from '@angular/core';
import { ColorList } from '../queries/view-models/color-list';
import { FuelList } from '../queries/view-models/fuel-list';
import { ModelList } from '../../models/queries/view-models/model-list';
import { BrandList } from '../../brands/queries/view-models/brand-list';
import { QueriesHandlerService } from 'src/app/shared/handlers/query-handler-service';
import { ListColors } from '../queries/list-colors';
import { ListFuels } from '../queries/list-fuels';
import { ListModels } from '../../models/queries/list-models';
import { ListBrands } from '../../brands/queries/list-brands';
import { FormGroup, FormBuilder, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CreateVechicle } from '../mutations/create-vehicle';
import { MutationsHandlerService } from 'src/app/shared/handlers/mutation-handler-service';
import { NewId } from 'src/app/shared/random/new-id';
import { UpdateVechicle } from '../mutations/update-vehicle';
import { GetVehicle } from '../queries/get-vehicle';
import { VehicleDetail } from '../queries/view-models/vehicle-detail';
import { SnackService } from 'src/app/shared/services/snack-service';
import { ListModelsSelect } from 'src/app/models/queries/list-models-select';
import { ModelSelectList } from 'src/app/models/queries/view-models/model-select-list';
import { VehiclesFormPhotoComponent } from '../vehicles-form-photo/vehicles-form-photo.component';
import { ModalService } from 'src/app/shared/modal/modal.service';

@Component({
  selector: 'app-vehicles-form',
  templateUrl: './vehicles-form.component.html',
  styleUrls: ['./vehicles-form.component.css']
})
export class VehiclesFormComponent implements OnInit {
  id: string;
  isNew: boolean;
  form: FormGroup;
  vehicle: VehicleDetail;

  colors: ColorList[] = [];
  fuels: FuelList[] = [];
  brands: BrandList[] = [];
  models: ModelSelectList[] = [];

  mutationClient = {
    fuelName: '',
    colorName: '',
    modelName: '',
    brandName: ''
  };

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private modalService: ModalService,
    private formBuilder: FormBuilder,
    private snackService: SnackService,
    private queriesHandler: QueriesHandlerService,
    private mutationsHandler: MutationsHandlerService
  ) {
    this.id = this.activatedRoute.snapshot.paramMap.get('id');
    this.isNew = !this.id;
    this.form = this.formBuilder.group({
      imageBase64: new FormControl(''),
      year: new FormControl(null, [Validators.min(1950), Validators.required]),
      colorId: new FormControl(null, [Validators.required]),
      fuelId: new FormControl(null, [Validators.required]),
      brandId: new FormControl(null, [Validators.required]),
      modelId: new FormControl(null, [Validators.required])
    });
  }

  ngOnInit(): void {
    this.loadSelects();
    this.loadVehicle();
  }

  loadVehicle() {
    if (this.isNew) return;
    const query = new GetVehicle(this.id);
    this.queriesHandler.handle(query).subscribe(
      (rs) => this.setData(rs.data),
      () => this.snackService.open('Falha ao carregar veículo!')
    );
  }

  setData(vehicle: VehicleDetail) {
    this.vehicle = vehicle;
    this.form.patchValue(this.vehicle);
    this.mutationClient = {
      fuelName: this.vehicle.fuelName,
      colorName: this.vehicle.colorName,
      brandName: this.vehicle.brandName,
      modelName: this.vehicle.modelName
    };
  }

  save() {
    this.form.markAllAsTouched();

    if (!this.isValidForm()) return;
    const value = this.form.getRawValue();
    if (this.isNew) {
      value.id = NewId();
      const mutation = Object.assign(new CreateVechicle(), value);
      this.mutationsHandler.handle(mutation).subscribe(
        (rs) => this.close(),
        () => this.snackService.open('Falha ao criar veículo!')
      );
    } else {
      value.id = this.id;
      const mutation = Object.assign(new UpdateVechicle(), value);
      this.mutationsHandler.handle(mutation).subscribe(
        (rs) => this.close(),
        () => this.snackService.open('Falha ao atualizar veículo!')
      );
    }
  }

  updatePhoto() {
    this.modalService.openForm<string>(VehiclesFormPhotoComponent).subscribe(file => {
      this.form.patchValue({ imageBase64: file });
      this.form.markAsDirty();
    });
  }

  removePhoto() {
    this.form.patchValue({ imageBase64: null });
    this.form.markAsDirty();
  }

  close() {
    this.router.navigate(['vehicles']);
  }

  onSelect(valueId: string, fieldId: string): void {
    const control = this.form.controls[fieldId];
    control.setValue(valueId);
    control.updateValueAndValidity();
    this.form.markAsDirty();
  }

  isValidForm(): boolean {
    this.form.markAllAsTouched();

    if (!this.form.valid) {
      this.snackService.open('Existem campos inválidos!');
      return false;
    }
    return true;
  }

  isValidField(fieldId: string): boolean {
    const field = this.form.controls[fieldId];
    return field.valid || !field.touched;
  }

  loadModels(brandId: string) {
    this.mutationClient.modelName = '';
    this.onSelect(null, 'modelId');
    const listModels = new ListModelsSelect();
    listModels.brandId = brandId;
    this.queriesHandler.handle(listModels).subscribe(
      (rs) => this.models = rs.data,
      ()  => this.snackService.open('Falha ao carregar modelos de veículos!'));
  }

  loadSelects() {
    const listColors = new ListColors();
    this.queriesHandler.handle(listColors).subscribe(
      (rs) => this.colors = rs.data,
      ()  => this.snackService.open('Falha ao carregar cores!'));

    const listFuels = new ListFuels();
    this.queriesHandler.handle(listFuels).subscribe(
      (rs) => this.fuels = rs.data,
      ()  => this.snackService.open('Falha ao carregar combustíveis!'));

    const listBrands = new ListBrands();
    this.queriesHandler.handle(listBrands).subscribe(
      (rs) => this.brands = rs.data,
      ()  => this.snackService.open('Falha ao carregar marcas de veículos!'));
  }
}

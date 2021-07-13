import { Component, OnInit, KeyValueDiffers } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { QueriesHandlerService } from 'src/app/shared/handlers/query-handler-service';
import { FormGroup, FormBuilder, FormControl, Validators } from '@angular/forms';
import { SnackService } from 'src/app/shared/services/snack-service';
import { AnnouncementSelectList } from '../queries/view-models/announcement-select-list';
import { ReservationDetail } from '../queries/view-models/reservation-detail';
import { GetReservation } from '../queries/get-reservation';
import { ListAnnouncementSelectList } from '../queries/list-announcements-select';
import { NewId } from 'src/app/shared/random/new-id';
import { CreateReservation } from '../mutations/create-reservation';
import { MutationsHandlerService } from 'src/app/shared/handlers/mutation-handler-service';
import { UpdateReservation } from '../mutations/update-reservation';
import { IMutationResult } from 'src/app/shared/handlers/results/mutation-result';
import { HttpErrorResponse } from '@angular/common/http';
import { EStatusCode } from 'src/app/shared/handlers/enums/status-code';
import { ModalService } from 'src/app/shared/modal/modal.service';
import { AuthService } from 'src/app/shared/services/auth-service';

@Component({
  selector: 'app-reservations-form',
  templateUrl: './reservations-form.component.html',
  styleUrls: ['./reservations-form.component.css']
})
export class ReservationsFormComponent implements OnInit {

  id: string;
  idAnnouncement: string;
  isNew: boolean;

  form: FormGroup;
  reservation: ReservationDetail;

  announcements: AnnouncementSelectList[] = [];
  announcementName: string;

  constructor(
    private router: Router,
    private authService: AuthService,
    private formBuilder: FormBuilder,
    private snackService: SnackService,
    private modalService: ModalService,
    private activatedRouter: ActivatedRoute,
    private mutationsHandler: MutationsHandlerService,
    private queriesHandler: QueriesHandlerService
  ) {
    this.id = this.activatedRouter.snapshot.paramMap.get('id');
    this.idAnnouncement = this.activatedRouter.snapshot.paramMap.get('id_announcement');
    this.isNew = !this.id;
    this.form = this.formBuilder.group({
      contactName: new FormControl('', [Validators.required, Validators.maxLength(150)]),
      contactPhone: new FormControl('', [Validators.required, Validators.maxLength(15)]),
      announcementId: new FormControl(this.idAnnouncement, [Validators.required])
    });
  }

  ngOnInit(): void {
    this.loadSelects();
    this.loadReservation();
  }

  loadReservation() {
    if (!this.authService.validateAuthorization()) {
      if (!localStorage.getItem('contact')) return;
      const contact = JSON.parse(atob(localStorage.getItem('contact')));
      this.form.markAsDirty();
      return this.form.patchValue(contact);
    }
    if (this.isNew) return;

    const query = new GetReservation(this.id);
    this.queriesHandler.handle(query).subscribe(
      (rs) => this.setData(rs.data),
      () => this.snackService.open('Falha ao carregar reserva!')
    );
  }

  setData(reservation: ReservationDetail) {
    this.reservation = reservation;
    this.form.patchValue(this.reservation);
    this.announcementName = reservation.announcementName;
  }

  save() {
    if (!this.isValidForm()) return;
    const value = this.form.getRawValue();
    if (this.isNew) {
      value.id = NewId();
      const mutation = Object.assign(new CreateReservation(), value);
      this.mutationsHandler.handle(mutation).subscribe(
        () => {
          if (!this.authService.validateAuthorization()){
            const contactData = { contactName: value.contactName, contactPhone: value.contactPhone };
            localStorage.setItem('contact', btoa(JSON.stringify(contactData)));
          }
          if (!this.idAnnouncement || this.authService.validateAuthorization()) return this.close();
          const message = 'O Vendedor irá entrar em contato para combinar o pagamento';
          this.modalService.showInformation('Compra', message).subscribe(() => {
            this.router.navigate(['home']);
          });
        },
        (err: HttpErrorResponse) => {
          const result = err.error as IMutationResult;
          const msgDuplicateName = 'Contact with ContactPhone already exists';
          if (err.status === EStatusCode.conflict && result.message.indexOf(msgDuplicateName) !== -1)
            return this.snackService.open('Já existe uma reserva com este telefone!');
          this.snackService.open('Falha ao criar reserva!');
        }
      );
    } else {
      value.id = this.id;
      const mutation = Object.assign(new UpdateReservation(), value);
      this.mutationsHandler.handle(mutation).subscribe(
        () => this.close(),
        (err: HttpErrorResponse) => {
          const result = err.error as IMutationResult;
          const msgDuplicateName = 'Contact with ContactPhone already exists';
          if (err.status === EStatusCode.conflict && result.message.indexOf(msgDuplicateName) !== -1)
            return this.snackService.open('Já existe uma reserva com este telefone!');
          this.snackService.open('Falha ao atualizar reserva!');
        }
      );
    }
  }

  close() {
    if (this.idAnnouncement) return this.router.navigate(['home']);
    this.router.navigate(['reservations']);
  }

  loadSelects() {
    const listAnnouncements = new ListAnnouncementSelectList();
    this.queriesHandler.handle(listAnnouncements).subscribe(
      (rs) => {
        this.announcements = rs.data;
        if (this.idAnnouncement) {
          const announcement = rs.data.find(f => f.id === this.idAnnouncement);
          this.announcementName = announcement.name;
        }
      },
      () => this.snackService.open('Falha ao carregar anúncios!')
    );
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
      this.snackService.open('Exitem campos inválidos!');
      return false;
    }

    return true;
  }

  isValidField(fieldId: string): boolean {
    const control = this.form.controls[fieldId];
    return control.valid || !control.touched;
  }
}

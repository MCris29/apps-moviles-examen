import { Component, OnInit } from '@angular/core';
import { Chat } from '../shared/Chat';
import { ChatService } from './../shared/chat.service';
import { FormGroup, FormBuilder } from '@angular/forms';
import { Geolocation } from '@ionic-native/geolocation/ngx';

import { Observable } from 'rxjs';
import { finalize, tap } from 'rxjs/operators';
import {
  AngularFireStorage,
  AngularFireUploadTask,
} from '@angular/fire/storage';
import {
  AngularFirestore,
  AngularFirestoreCollection,
} from '@angular/fire/firestore';

export interface imgFile {
  name: string;
  filepath: string;
  size: number;
}

@Component({
  selector: 'app-chat',
  templateUrl: 'chat.page.html',
  styleUrls: ['chat.page.scss'],
})
export class ChatPage implements OnInit {
  bookingForm: FormGroup;
  Bookings = [];
  point: any;
  location: boolean;

  // File upload task
  fileUploadTask: AngularFireUploadTask;

  // Upload progress
  percentageVal: Observable<number>;

  // Track file uploading with snapshot
  trackSnapshot: Observable<any>;

  // Uploaded File URL
  UploadedImageURL: Observable<string>;

  // Uploaded image collection
  files: Observable<imgFile[]>;

  // Image specifications
  imgName: string;
  imgSize: number;

  // File uploading status
  isFileUploading: boolean;
  isFileUploaded: boolean;

  private filesCollection: AngularFirestoreCollection<imgFile>;

  constructor(
    private aptService: ChatService,
    public fb: FormBuilder,
    private geolocation: Geolocation,
    private afs: AngularFirestore,
    private afStorage: AngularFireStorage
  ) {
    this.isFileUploading = false;
    this.isFileUploaded = false;

    // Define uploaded files collection
    this.filesCollection = afs.collection<imgFile>('imagesCollection');
    this.files = this.filesCollection.valueChanges();
  }

  ngOnInit() {
    this.getLocation();
    this.location = false;

    this.bookingForm = this.fb.group({
      user: [''],
      message: [''],
      location: [''],
    });

    this.fetchBookings();
    let bookingRes = this.aptService.getBookingList();
    bookingRes.snapshotChanges().subscribe((res) => {
      this.Bookings = [];
      res.forEach((item) => {
        let a = item.payload.toJSON();
        a['$key'] = item.key;
        this.Bookings.push(a as Chat);
      });
    });
  }

  fetchBookings() {
    this.aptService
      .getBookingList()
      .valueChanges()
      .subscribe((res) => {
        console.log(res);
      });
  }

  formSubmit() {
    if (!this.bookingForm.valid) {
      return false;
    } else {
      if (this.location) {
        this.bookingForm.value['location'] = this.point;
      }
      this.aptService
        .createBooking(this.bookingForm.value)
        .then((res) => {
          console.log(res);
          console.log('booking', this.bookingForm.value['location']);
          this.bookingForm.reset();
          this.location = false;
        })
        .catch((error) => console.log(error));
    }
  }

  /**
   * Enviar coordenadas a firebase
   */
  sendPoint() {
    this.location = true;
    this.getLocation();
    alert('Tu ubicación es: ' + this.point);
    alert('Presiona enviar para enviar tu ubicación');
  }

  getLocation() {
    this.geolocation
      .getCurrentPosition()
      .then((resp) => {
        let lat = resp.coords.latitude;
        let lng = resp.coords.longitude;
        console.log('Latitud', lat);
        console.log('Longitud', lng);

        this.point = [lat, lng];
      })
      .catch((error) => {
        console.log('Error getting location', error);
      });
  }

  uploadImage(event: FileList) {
    const file = event.item(0);

    // Image validation
    if (file.type.split('/')[0] !== 'image') {
      console.log('File type is not supported!');
      return;
    }

    this.isFileUploading = true;
    this.isFileUploaded = false;

    this.imgName = file.name;

    // Storage path
    const fileStoragePath = `filesStorage/${new Date().getTime()}_${file.name}`;

    // Image reference
    const imageRef = this.afStorage.ref(fileStoragePath);

    // File upload task
    this.fileUploadTask = this.afStorage.upload(fileStoragePath, file);

    // Show uploading progress
    this.percentageVal = this.fileUploadTask.percentageChanges();
    this.trackSnapshot = this.fileUploadTask.snapshotChanges().pipe(
      finalize(() => {
        // Retreive uploaded image storage path
        this.UploadedImageURL = imageRef.getDownloadURL();

        this.UploadedImageURL.subscribe(
          (resp) => {
            this.storeFilesFirebase({
              name: file.name,
              filepath: resp,
              size: this.imgSize,
            });
            this.isFileUploading = false;
            this.isFileUploaded = true;
          },
          (error) => {
            console.log(error);
          }
        );
      }),
      tap((snap) => {
        this.imgSize = snap.totalBytes;
      })
    );
  }

  storeFilesFirebase(image: imgFile) {
    const fileId = this.afs.createId();

    this.filesCollection
      .doc(fileId)
      .set(image)
      .then((res) => {
        console.log(res);
      })
      .catch((err) => {
        console.log(err);
      });
  }
}

import { Injectable } from '@angular/core';
import { Map } from '../shared/Map';
import {
  AngularFireDatabase,
  AngularFireList,
  AngularFireObject,
} from '@angular/fire/database';

@Injectable({
  providedIn: 'root'
})
export class MapService {
  bookingListRef: AngularFireList<any>;
  bookingRef: AngularFireObject<any>;

  constructor(private db: AngularFireDatabase) {}

  // Create
  createBooking(apt: Map) {
    console.log(apt[0]);
    console.log(apt[1]);
    console.log(apt[2]);
    return this.bookingListRef.push({
      lat: apt[0],
      lng: apt[1],
      user: apt[2],
    });
  }

  // Get List
  getBookingList() {
    this.bookingListRef = this.db.list('/chat');
    return this.bookingListRef;
  }
}

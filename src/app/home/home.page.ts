import { Component, NgZone } from '@angular/core';
import { Geolocation } from '@ionic-native/geolocation/ngx';
import * as L from 'leaflet';
import { Map } from '../shared/Map';
import { MapService } from './../shared/map.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  map: L.Map;
  tempIcon: any;
  point: any;
  Bookings = [];

  constructor(
    private aptService: MapService,
    private geolocation: Geolocation,
    public zone: NgZone
  ) {}

  ngOnInit() {
    this.getLocation();

    this.fetchBookings();
    let bookingRes = this.aptService.getBookingList();
    bookingRes.snapshotChanges().subscribe((res) => {
      this.Bookings = [];
      res.forEach((item) => {
        let a = item.payload.toJSON();
        a['$key'] = item.key;
        this.Bookings.push(a as Map);
      });
    });
  }

  showMarkerMenu() {
    console.log('Se ha pulsado click en un marcador puesto.');
  }

  fetchBookings() {
    this.aptService
      .getBookingList()
      .valueChanges()
      .subscribe((res) => {
        console.log(res);
      });
  }

  /**
   * Enviar coordenadas a firebase
   */
  sendPoint() {
    this.aptService
      .createBooking(this.point)
      .then((res) => {
        console.log("res", res);
      })
      .catch((error) => console.log(error));
  }

  /**
   * Obtener Coordenadas
   */
  getLocation() {
    this.geolocation
      .getCurrentPosition()
      .then((resp) => {
        let lat = resp.coords.latitude;
        let lng = resp.coords.longitude;
        console.log('Latitud', lat);
        console.log('Longitud', lng);

        this.point = [lat, lng];
        console.log('point', this.point);

        this.map = L.map('map', {
          center: [lat, lng],
          zoom: 15,
          renderer: L.canvas(),
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          // maxZoom: 12,
          attribution:
            '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(this.map);

        setTimeout(() => {
          this.map.invalidateSize();
        }, 0);

        this.tempIcon = L.icon({
          iconUrl: 'assets/icon/favicon.png',
          shadowUrl: '',
          iconSize: [32, 32], // size of the icon
          shadowSize: [0, 0], // size of the shadow
          iconAnchor: [32, 32], // point of the icon which will correspond to markers location
          shadowAnchor: [0, 0], // the same for the shadow
          popupAnchor: [32, 20], // point from which the popup should open relative to the iconAnchor
        });

        let tempMarker = L.marker([lat, lng], { icon: this.tempIcon }).addTo(
          this.map
        );
      })
      .catch((error) => {
        console.log('Error getting location', error);
      });
  }
}

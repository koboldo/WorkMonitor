import { Injectable } from '@angular/core';
import { Observable, AsyncSubject, Subject } from 'rxjs';
import { CodeValue } from '../_models/code';
@Injectable({
    providedIn: 'root'
})

export class VersionService {

    private _history: CodeValue[];

    get history() {
        return this._history;
    }

    get version() {
        return this._history[0]['code'];
    }

    constructor() {
        this._history = [

            new CodeValue('1.5.44', 'Dodanie filtorwania ceny zlecenia za pomocą pola tekstowego'),
            new CodeValue('1.5.43', 'Zmiana tabel na turbo table'),
            new CodeValue('1.5.42', 'Dodanie filtrowania ceny jako suwak'),
            new CodeValue('1.5.41', 'Dodanie podsumowań dla tabel'),
			new CodeValue('1.5.40', 'Składowa budżetu puli, obsługa TDS completedWo'),
            new CodeValue('1.5.39', 'Obsługa telefonów - menu'),
            new CodeValue('1.5.38', 'Dodanie grupowego przypisywania zleceń, poprawki filtrowania Turbo Table'),
            new CodeValue('1.5.37', 'Dodanie statusu Kosz dla zleceń'),
            new CodeValue('1.5.36', 'Dodanie informacji o puli i wykonawcach w historii zlecenia'),
            new CodeValue('1.5.35', 'Dodanie listy zrealizowanych (po raz pierwszy) zleceń na rozliczeniu'),
            new CodeValue('1.5.34', 'Poprawa kolorów podczas dodawania zleceń - kolory z definicji typów'),
            new CodeValue('1.5.33', 'Poprawa turbo table - dodanie przycisku edycji, dziedziczenie, doubleClick'),
            new CodeValue('1.5.32', 'Usunięcie zahardkodowanych kolorów i możliwość edycji typów zadań (kolory, przynależność do puli)'),
            new CodeValue('1.5.31', 'Współdzielenie obrotu na raportach'),
            new CodeValue('1.5.30', 'Przycisk edycji zlecenia, odświeżanie ostateniego zlecenia podczas dodawania i przypisywania wielu typów zleceń'),
            new CodeValue('1.5.29', 'Poprawa wyświetlania historii użytkownika'),
            new CodeValue('1.5.28', 'Poprawa przelogowania, usunięcie turbo table z menu do czasu zaimplementowania dziedziczenia'),
            new CodeValue('1.5.27', 'Poprawa przypisywania i edycji - awaria'),
            new CodeValue('1.5.26', 'Dodanie zakładki Prime Ng6 z Turbo Table'),
            new CodeValue('1.5.25', 'Rola zegarmistrz do aktualizacji czasu pracy dla OP i MG, sortowanie numerów stacji.'),
            new CodeValue('1.5.24', 'Poprawa sortowania typów, przypisywania wykonawcy podczas dodawania zlecenia, Poprawa wielokrotnego dodawania i modyfikacji stacji podczas dodawania wielu zleceń'),
            new CodeValue('1.5.23', 'Wyświetlanie historii zmian, przekazywanie Session-Id oraz Front-Version'),
            new CodeValue('1.5.22', 'Edytowalny zakres dat na zakladce raporty miesięczne'),
            new CodeValue('1.5.21', 'Czas pracy zmiana uprawnienia do zmiany roli MG i OP'),
            new CodeValue('1.5.20', 'Poprawka na zakres dat'),
            new CodeValue('1.5.19', 'Poprawka na zakres dat formularze (toISO)'),
            new CodeValue('1.5.18', 'Progress jako http interceptor'),
            new CodeValue('1.5.17', 'Poprawa przypisania wykonawcy podczas dodawania zlecenia,Średni obrót na osobę, liczenie wydajności usunięto urlop jako skladową w "Czas zadeklarowany", spójne sortowanie, poprawiony błąd z brakiem wyświetlania współczynnika na ekranie modyfikacji osoby, poprawiony błąd niepozwalający zakończyć współpracy z osobą, lepsze wykorzystanie miejsca w oknie podglądu szczegółów WO.'),
            new CodeValue('1.5.16', 'Przypisanie wykonawcy podczas dodawania zlecenia'),
            new CodeValue('1.5.15', 'Poprawa dat'),
            new CodeValue('1.5.14', 'Możliwość zwiększenia przerwy, poprawa zaznaczania na "wydajność zespołu" '),
            new CodeValue('1.5.13', 'Czas szkolenia dodany do czasu całkowitego, zmiana porządkowania kolumn, filtrowanie statusu w "Wydajności zespołu" '),
            new CodeValue('1.5.12', 'Poprawka wyswietlania bledu rejestracji czasu pracy '),
            new CodeValue('1.5.11', 'Logika wycen OP - wycena z workType, inne stany wycena usunieta '),
            new CodeValue('1.5.10', 'Blokowanie zmiany na stan Zawieszone podczas odwieszania '),
            new CodeValue('1.5.9',  'Pracochlonnosc -1 poprawka, zmiana stanu na Wydane '),
            new CodeValue('1.5.8',  'dodawanie WO typ orderu - autocomplete z kolorami '),
            new CodeValue('1.5.7 ', 'Rutowanie do poprawnej strony po modyfikacji użytkownika/kontrahenta'),
            new CodeValue('1.5.6 ', 'Ignorowanie typu 13.0 (brak pracy) na raportach wydajności'),
            new CodeValue('1.5.5 ', 'Pracochlonnosc poprawka dotyczaca 0 na raportach'),
            new CodeValue('1.5.4 ', 'Pracochlonnosc -13 poprawka'),
            new CodeValue('1.5.3 ', 'Lista zleceń na raporcie wydajności'),
            new CodeValue('1.5.2 ', 'Pracochlonnosc -13 poprawka'),
            new CodeValue('1.5.1 ', 'Pozwol na wejscie po zarejestrowanym wyjsciu'),
            new CodeValue('1.5.0 ', 'Angular 6, primeng 6, still deprecated theme omega'),
            new CodeValue('1.4.17', 'Sortowanie listy typów zleceń podczas dodawania zlecenia'),
            new CodeValue('1.4.16', 'Raporty miesieczne'),
            new CodeValue('1.4.15', 'Wynagrodzenia uzupelnienie po zmianie menu'),
            new CodeValue('1.4.14', 'Hierarchiczne menu'),
            new CodeValue('1.4.13', 'Widok czasów miesięcznych, Raport utylizacji - rozszerzenie'),
            new CodeValue('1.4.12', 'Wynagrodzenia naprawiony bug po dodaniu roli CN'),
            new CodeValue('1.4.11', 'Dodanie roli CN - Zleceniobiorca'),
            new CodeValue('1.4.10', 'cancelled tab added '),
            new CodeValue('1.4.9', 'complexity bug on group add orders fixed   '),
            new CodeValue('1.4.8', 'censor user removed   '),
            new CodeValue('1.4.7', 'No person history in cache   '),
            new CodeValue('1.4.6', 'problem z JSON.stringify(user:User) censorUser   '),
            new CodeValue('1.4.5', 'problem z JSON.stringify(user:User)   '),
            new CodeValue('1.4.4', 'dedykowany timesheet na user-attendance-register   '),
            new CodeValue('1.4.3', 'poprawka analiza pracowników - wycena ze zlecenia, usuniecie typów http   '),
            new CodeValue('1.4.2', 'dodanie zakladki pracownicy dla operatorów, poprawka cache - nowe url, lekkie zmiany w wyglądzie ui-fieldset-legend, wo-details   '),
            new CodeValue('1.4.1', 'Wygaszanie cachea  '),
            new CodeValue('1.4.0', 'Nowy klient HTTP, cache\'ujacy interceptor'),
            new CodeValue('1.3.19', 'Poprawka do grupowej zmiany statusów - zaznaczanie jedynie widocznych zleceń, male zmiany w rejestracji czasu pracy'),
            new CodeValue('1.3.18', 'Poprawka do grupowej zmiany statusów - logika przycisków, logika dla trybu operator, czyszczenie zmiennych '),
            new CodeValue('1.3.17', 'Poprawka zmiana strefy czasowej w komentarzach '),
            new CodeValue('1.3.16', 'Zmiana statusów - implementacja rekurencyjnie, usuwanie relacji przypisania gdy status zmieniany na Otwarte '),
            new CodeValue('1.3.15', 'Zmiana statusów zleceń branch ChangeOrdersGroupStatus '),
            new CodeValue('1.3.14', 'payrolle historyczne i biezacy w trybie lazy'),
            new CodeValue('1.3.13', 'payrolle historyczne w trybie lazy'),
            new CodeValue('1.3.12', 'Dodanie obslugi szkolen, wyswietlanie liczb na zakladce wydajność'),
            new CodeValue('1.3.11', 'Zmiana kalendarza na polski branch UpdateCalendarLocalization '),
            new CodeValue('1.3.10', 'Dodanie w zakładce czas pracy kolumny określającej czas szkolenia w danym dniu '),
            new CodeValue('1.3.9', 'Dodanie możliwośći eksportowania historycznych wypłat dla poszczególnych miesięcy '),
            new CodeValue('1.3.8', 'excelId moze byc 0, dodanie kolumny imie podczas exportu wynagrodzenia '),
            new CodeValue('1.3.7', 'Poprawka edytownia zlecenia, usunięcie linii odpowiedzialnej za zapisywanie domyślnej czasochłonności '),
            new CodeValue('1.3.6', 'filtorwanie bylych pracowników na zakładce pracownicy '),
            new CodeValue('1.3.5', 'usuwanie pracownika mozliwe tylko dla isEmployed, zmiana excelId podczas usuwania'),
            new CodeValue('1.3.4', 'Poprawka edycji użytkownika, zakończ współpracę, usuwanie danych pracownika branch UpdateEditUser'),
            new CodeValue('1.3.3', 'Poprawka dodawania uztkownika branch RegisteredUserUpdate '),
            new CodeValue('1.3.2', 'Logika wspolczynnik puli vs salary/leave rate, logika dodawania isEmployed, excelId, excelId dodane do users-display oraz users-payroll '),
            new CodeValue('1.3.1', 'Poprawka - Komentowanie zawieszonych zleceń'),
            new CodeValue('1.3.0', 'Wyswietlanie historii pracowników, wymaga nowej bazy'),
            new CodeValue('1.2.14', 'Komentowanie zawieszonych zleceń'),
            new CodeValue('1.2.13', 'Poprawki (cena z groszami, opis typu zlecenia sciagany wg biura)'),
            new CodeValue('1.2.12', 'Rola CL - Protokół, na razie rw'),
            new CodeValue('1.2.11', 'Rola PA - Parametryzator, cena worktype moze byc 0'),
            new CodeValue('1.2.10', 'Poprawa do komentarzy (usuwanie starych), ukrywanie niepracujacych na timesheetach'),
            new CodeValue('1.2.9', 'Dodanie nowej roli Analityk'),
            new CodeValue('1.2.8', 'dodawanie parametryzachu typow dla wszystkich regionow w jednym kroku'),
            new CodeValue('1.2.7', 'Filtrowanie zleceń nie gotowych do protokołu'),
            new CodeValue('1.2.6', 'komentowanie inz '),
            new CodeValue('1.2.5', 'pusty komentarz - zawieszone '),
            new CodeValue('1.2.4', 'usuwanie urlopu '),
            new CodeValue('1.2.3', 'modyfikacja VE (region), poprawka do timesheet break empty, poprawka do payroll - currentPaylod[0] could be null '),
            new CodeValue('1.2.2', 'poprawka do payroll - brak widocznosci stawki puli - bez formatowania '),
            new CodeValue('1.2.1', 'poprawka brak opisow my-order, dodanie suspended w '),
            new CodeValue('faza I', 'polirole, rozliczenie, protokol (excel), wprowadzenie wielu WO')
        ];
    }





}
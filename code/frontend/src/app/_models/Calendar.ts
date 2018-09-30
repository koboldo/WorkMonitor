export class Calendar {
	        firstDayOfWeek: number;
            monthNames: string []; 
            monthNamesShort: string [];
            dayNames: string [];
            dayNamesShort: string [];
            dayNamesMin: string [];
            today: string;
            clear: string;
	constructor(){
            this.firstDayOfWeek= 1,
            this.monthNames= ['Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec','Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień'],
            this.monthNamesShort=['Sty','Lut','Mar','Kwi','Maj','Cze', 'Lip','Sie','Wrz','Paź','Lis','Gru'],
            this.dayNames=['Niedziela','Poniedziałek','Wtorek','Środa','Czwartek','Piątek','Sobota'],
            this.dayNamesShort=['Nie','Pon','Wt','Śr','Czw','Pt','So'],
            this.dayNamesMin=['N','P','W','Ś','Cz','P','S'],
            this.today='Today',
            this.clear='Clear'
    }
}

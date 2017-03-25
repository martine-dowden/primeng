import {NgModule,Component,ElementRef,AfterViewInit,OnDestroy,OnInit,Input,Output,SimpleChange,EventEmitter,forwardRef,Renderer,ViewChild} from '@angular/core';
import {trigger,state,style,transition,animate} from '@angular/animations';
import {CommonModule} from '@angular/common';
import {ButtonModule} from '../button/button';
import {InputTextModule} from '../inputtext/inputtext';
import {DomHandler} from '../dom/domhandler';
import {AbstractControl, NG_VALUE_ACCESSOR, NG_VALIDATORS, ControlValueAccessor} from '@angular/forms';

export const CALENDAR_VALUE_ACCESSOR: any = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => Calendar),
  multi: true
};

export const CALENDAR_VALIDATOR: any = {
  provide: NG_VALIDATORS,
  useExisting: forwardRef(() => Calendar),
  multi: true
};

export interface LocaleSettings {
    firstDayOfWeek?: number;
    dayNames: string[];
	dayNamesShort: string[];
	dayNamesMin: string[];
    monthNames: string[];
    monthNamesShort: string[];
}

@Component({
    selector: 'p-calendar',
    template:  `
        <span [ngClass]="{'ui-calendar':true,'ui-calendar-w-btn':showIcon}" [ngStyle]="style" [class]="styleClass">
            <ng-template [ngIf]="!inline">
                <input #inputfield type="text" [attr.required]="required" [value]="inputFieldValue" (focus)="onInputFocus(inputfield, $event)" (keydown)="onInputKeydown(inputfield, $event)" (click)="closeOverlay=false" (blur)="onInputBlur($event)"
                    [readonly]="readonlyInput" (input)="onInput($event)" [ngStyle]="inputStyle" [class]="inputStyleClass" [placeholder]="placeholder||''" [disabled]="disabled" [attr.tabindex]="tabindex"
                    [ngClass]="'ui-inputtext ui-widget ui-state-default ui-corner-all'"
                    [attr.aria-labelledby]="labelledby"
                    ><button type="button" [icon]="icon" pButton *ngIf="showIcon" (click)="onButtonClick($event,inputfield)"
                    [ngClass]="{'ui-datepicker-trigger':true,'ui-state-disabled':disabled}" [disabled]="disabled"></button>
            </ng-template>
            <div #datepicker class="ui-datepicker ui-widget ui-widget-content ui-helper-clearfix ui-corner-all" [ngClass]="{'ui-datepicker-inline':inline,'ui-shadow':!inline,'ui-state-disabled':disabled,'ui-datepicker-timeonly':timeOnly}"
                [ngStyle]="{'display': inline ? 'inline-block' : (overlayVisible ? 'block' : 'none')}" (click)="onDatePickerClick($event)" [@overlayState]="inline ? 'visible' : (overlayVisible ? 'visible' : 'hidden')">

                <div class="ui-datepicker-header ui-widget-header ui-helper-clearfix ui-corner-all" *ngIf="!timeOnly && (overlayVisible || inline)">
                    <ng-content select="p-header"></ng-content>
                    <a class="ui-datepicker-prev ui-corner-all" href="#" (click)="prevMonth($event)" (keydown)="onHeaderKeyDown($event)" aria-label="Previous Month">
                        <span class="fa fa-angle-left" aria-hidden="true"></span>
                    </a>
                    <a class="ui-datepicker-next ui-corner-all" href="#" (click)="nextMonth($event)" (keydown)="onHeaderKeyDown($event)" aria-label="Next Month">
                        <span class="fa fa-angle-right" aria-hidden="true"></span>
                    </a>
                    <div class="ui-datepicker-title">
                        <span class="ui-datepicker-month" *ngIf="!monthNavigator">{{currentMonthText}}</span>
                        <select class="ui-datepicker-month" *ngIf="monthNavigator" (change)="onMonthDropdownChange($event.target.value)" (keydown)="onDropDownHeader($event)" aria-label="Month">
                            <option [value]="i" *ngFor="let month of locale.monthNames;let i = index" [selected]="i == currentMonth">{{month}}</option>
                        </select>
                        <select class="ui-datepicker-year" *ngIf="yearNavigator" (change)="onYearDropdownChange($event.target.value)" (keydown)="onDropDownHeader($event)" aria-label="Year">
                            <option [value]="year" *ngFor="let year of yearOptions" [selected]="year == currentYear">{{year}}</option>
                        </select>
                        <span class="ui-datepicker-year" *ngIf="!yearNavigator">{{currentYear}}</span>
                    </div>
                </div>
                <table class="ui-datepicker-calendar" *ngIf="!timeOnly && (overlayVisible || inline)">
                    <thead>
                        <tr>
                            <th scope="col" *ngFor="let weekDay of weekDays;let begin = first; let end = last">
                                <span>{{weekDay}}</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr *ngFor="let week of dates">
                            <td *ngFor="let date of week" [ngClass]="{'ui-datepicker-other-month ui-state-disabled':date.otherMonth,
                                'ui-datepicker-current-day':isSelected(date),'ui-datepicker-today':date.today}">
                                <a class="ui-state-default" href="#" *ngIf="date.otherMonth ? showOtherMonths : true"
                                    [ngClass]="{'ui-state-active':isSelected(date), 'ui-state-highlight':date.today,'ui-state-disabled':!date.selectable}"
                                    (click)="onDateSelect($event,date, inputField)" (keydown)="onCalendarKeyDown($event)">{{date.day}}</a>
                            </td>
                        </tr>
                    </tbody>
                </table>
                <div class="ui-timepicker ui-widget-header ui-corner-all" *ngIf="showTime||timeOnly">
                    <div class="ui-hour-picker">
                        <a href="#" (click)="incrementHour($event)" aria-label="Increment Hours" (keydown)="onTimepikerKeyDown($event, 'hour')">
                            <span class="fa fa-angle-up" aria-hidden="true"></span>
                        </a>
                        <span [ngStyle]="{'display': currentHour < 10 ? 'inline': 'none'}">0</span><span>{{currentHour}}</span>
                        <a href="#" (click)="decrementHour($event)" aria-label="Decrement Hours" (keydown)="onTimepikerKeyDown($event, 'hour')">
                            <span class="fa fa-angle-down" aria-hidden="true"></span>
                        </a>
                    </div>
                    <div class="ui-separator" role="presentation">
                        <a tabindex="-1" aria-hidden="true">
                            <span class="fa fa-angle-up" aria-hidden="true"></span>
                        </a>
                        <span>:</span>
                        <a aria-hidden="true" tabindex="-1">
                            <span class="fa fa-angle-down" aria-hidden="true"></span>
                        </a>
                    </div>
                    <div class="ui-minute-picker">
                        <a href="#" (click)="incrementMinute($event)" aria-label="Increment Minutes" (keydown)="onTimepikerKeyDown($event, 'minute')">
                            <span class="fa fa-angle-up" aria-hidden="true"></span>
                        </a>
                        <span [ngStyle]="{'display': currentMinute < 10 ? 'inline': 'none'}">0</span><span>{{currentMinute}}</span>
                        <a href="#" (click)="decrementMinute($event)" aria-label="Decrement Minutes" (keydown)="onTimepikerKeyDown($event, 'minute')">
                            <span class="fa fa-angle-down" aria-hidden="true"></span>
                        </a>
                    </div>
                    <div class="ui-separator" *ngIf="showSeconds" role="presentation">
                        <a aria-hidden="true">
                            <span class="fa fa-angle-up" aria-hidden="true"></span>
                        </a>
                        <span>:</span>
                        <a href="#" aria-hidden="true">
                            <span class="fa fa-angle-down" aria-hidden="true"></span>
                        </a>
                    </div>
                    <div class="ui-second-picker" *ngIf="showSeconds">
                        <a href="#" (click)="incrementSecond($event)" aria-label="Increment Seconds" (keydown)="onTimepikerKeyDown($event, 'second')">
                            <span class="fa fa-angle-up" aria-hidden="true"></span>
                        </a>
                        <span [ngStyle]="{'display': currentSecond < 10 ? 'inline': 'none'}">0</span><span>{{currentSecond}}</span>
                        <a href="#" (click)="incrementSecond($event)" aria-label="Decrement Seconds" (keydown)="onTimepikerKeyDown($event, 'second')">
                            <span class="fa fa-angle-down" aria-hidden="true"></span>
                        </a>
                    </div>
                    <div class="ui-ampm-picker" *ngIf="hourFormat=='12'">
                        <a href="#" (click)="toggleAMPM($event)" aria-label="Toggle AM PM" (keydown)="onTimepikerKeyDown($event, 'ampm')">
                            <span class="fa fa-angle-up" aria-hidden="true"></span>
                        </a>
                        <span>{{pm ? 'PM' : 'AM'}}</span>
                        <a href="#" (click)="toggleAMPM($event)" aria-label="Toggle AM PM" (keydown)="onTimepikerKeyDown($event, 'ampm')">
                            <span class="fa fa-angle-down" aria-hidden="true"></span>
                        </a>
                    </div>
                </div>
                <ng-content select="p-footer"></ng-content>
            </div>
        </span>
    `,
    animations: [
        trigger('overlayState', [
            state('hidden', style({
                opacity: 0
            })),
            state('visible', style({
                opacity: 1
            })),
            transition('visible => hidden', animate('400ms ease-in')),
            transition('hidden => visible', animate('400ms ease-out'))
        ])
    ],
    host: {
        '[class.ui-inputwrapper-filled]': 'filled',
        '[class.ui-inputwrapper-focus]': 'focus'
    },
    providers: [DomHandler,CALENDAR_VALUE_ACCESSOR,CALENDAR_VALIDATOR]
})
export class Calendar implements AfterViewInit,OnInit,OnDestroy,ControlValueAccessor {

    @Input() labelledby: string;

    @Input() defaultDate: Date;

    @Input() style: string;

    @Input() styleClass: string;

    @Input() inputStyle: string;

    @Input() inputStyleClass: string;

    @Input() placeholder: string;

    @Input() disabled: any;

    @Input() dateFormat: string = 'mm/dd/yy';

    @Input() inline: boolean = false;

    @Input() showOtherMonths: boolean = true;

    @Input() selectOtherMonths: boolean;

    @Input() showIcon: boolean;

    @Input() icon: string = 'fa-calendar';

    @Input() appendTo: any;

    @Input() readonlyInput: boolean;

    @Input() shortYearCutoff: any = '+10';

    @Input() monthNavigator: boolean;

    @Input() yearNavigator: boolean;

    @Input() yearRange: string;

    @Input() showTime: boolean;

    @Input() hourFormat: string = '24';

    @Input() timeOnly: boolean;

    @Input() stepHour: number = 1;

    @Input() stepMinute: number = 1;

    @Input() stepSecond: number = 1;

    @Input() showSeconds: boolean = false;

    @Input() required: boolean;

    @Input() showOnFocus: boolean = true;

    @Input() dataType: string = 'date';

    @Output() onFocus: EventEmitter<any> = new EventEmitter();

    @Output() onBlur: EventEmitter<any> = new EventEmitter();

    @Output() onSelect: EventEmitter<any> = new EventEmitter();

    @Input() locale: LocaleSettings = {
        firstDayOfWeek: 0,
        dayNames: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        dayNamesShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
        dayNamesMin: ["Su","Mo","Tu","We","Th","Fr","Sa"],
        monthNames: [ "January","February","March","April","May","June","July","August","September","October","November","December" ],
        monthNamesShort: [ "Jan", "Feb", "Mar", "Apr", "May", "Jun","Jul", "Aug", "Sep", "Oct", "Nov", "Dec" ]
    };

    @Input() tabindex: number;

    @ViewChild('datepicker') overlayViewChild: ElementRef;

    value: Date;

    dates: any[];

    weekDays: string[] = [];

    currentMonthText: string;

    currentMonth: number;

    currentYear: number;

    currentHour: number;

    currentMinute: number;

    currentSecond: number;

    pm: boolean;

    overlay: HTMLDivElement;

    overlayVisible: boolean;

    closeOverlay: boolean = true;

    dateClick: boolean;

    onModelChange: Function = () => {};

    onModelTouched: Function = () => {};

    calendarElement: any;

    documentClickListener: any;

    ticksTo1970: number;

    yearOptions: number[];

    focus: boolean;

    filled: boolean;

    inputFieldValue: string = null;

    _minDate: Date;

    _maxDate: Date;

    _isValid: boolean = true;

    @Input() get minDate(): Date {
        return this._minDate;
    }

    set minDate(date: Date) {
        this._minDate = date;
        this.createMonth(this.currentMonth, this.currentYear);
    }

    @Input() get maxDate(): Date {
        return this._maxDate;
    }

    set maxDate(date: Date) {
        this._maxDate = date;
        this.createMonth(this.currentMonth, this.currentYear);
    }

    constructor(public el: ElementRef, public domHandler: DomHandler,public renderer: Renderer) {}

    ngOnInit() {
        let date = this.defaultDate||new Date();
        let dayIndex = this.locale.firstDayOfWeek;
        for(let i = 0; i < 7; i++) {
            this.weekDays.push(this.locale.dayNamesMin[dayIndex]);
            dayIndex = (dayIndex == 6) ? 0 : ++dayIndex;
        }

        this.currentMonth = date.getMonth();
        this.currentYear = date.getFullYear();
        if(this.showTime) {
            this.currentMinute = date.getMinutes();
            this.currentSecond = date.getSeconds();
            this.pm = date.getHours() > 11;

            if(this.hourFormat == '12')
                this.currentHour = date.getHours() == 0 ? 12 : date.getHours() % 12;
            else
                this.currentHour = date.getHours();
        }
        else if(this.timeOnly) {
            this.currentMinute = 0;
            this.currentHour = 0;
            this.currentSecond = 0;
        }

        this.createMonth(this.currentMonth, this.currentYear);

        this.ticksTo1970 = (((1970 - 1) * 365 + Math.floor(1970 / 4) - Math.floor(1970 / 100) +
    		Math.floor(1970 / 400)) * 24 * 60 * 60 * 10000000);

        if(this.yearNavigator && this.yearRange) {
            this.yearOptions = [];
            let years = this.yearRange.split(':'),
            yearStart = parseInt(years[0]),
            yearEnd = parseInt(years[1]);

            for(let i = yearStart; i <= yearEnd; i++) {
                this.yearOptions.push(i);
            }
        }
    }

    ngAfterViewInit() {
        this.overlay = <HTMLDivElement> this.overlayViewChild.nativeElement;

        if(!this.inline && this.appendTo) {
            if(this.appendTo === 'body')
                document.body.appendChild(this.overlay);
            else
                this.domHandler.appendChild(this.overlay, this.appendTo);
        }
    }

    createMonth(month: number, year: number) {
        this.dates = [];
        this.currentMonth = month;
        this.currentYear = year;
        this.currentMonthText = this.locale.monthNames[month];
        let firstDay = this.getFirstDayOfMonthIndex(month, year);
        let daysLength = this.getDaysCountInMonth(month, year);
        let prevMonthDaysLength = this.getDaysCountInPrevMonth(month, year);
        let sundayIndex = this.getSundayIndex();
        let dayNo = 1;
        let today = new Date();

        for(let i = 0; i < 6; i++) {
            let week = [];

            if(i == 0) {
                for(let j = (prevMonthDaysLength - firstDay + 1); j <= prevMonthDaysLength; j++) {
                    let prev = this.getPreviousMonthAndYear(month, year);
                    week.push({day: j, month: prev.month, year: prev.year, otherMonth: true,
                            today: this.isToday(today, j, prev.month, prev.year), selectable: this.isSelectable(j, prev.month, prev.year)});
                }

                let remainingDaysLength = 7 - week.length;
                for(let j = 0; j < remainingDaysLength; j++) {
                    week.push({day: dayNo, month: month, year: year, today: this.isToday(today, dayNo, month, year),
                            selectable: this.isSelectable(dayNo, month, year)});
                    dayNo++;
                }
            }
            else {
                for (let j = 0; j < 7; j++) {
                    if(dayNo > daysLength) {
                        let next = this.getNextMonthAndYear(month, year);
                        week.push({day: dayNo - daysLength, month: next.month, year: next.year, otherMonth:true,
                                    today: this.isToday(today, dayNo - daysLength, next.month, next.year),
                                    selectable: this.isSelectable((dayNo - daysLength), next.month, next.year)});
                    }
                    else {
                        week.push({day: dayNo, month: month, year: year, today: this.isToday(today, dayNo, month, year),
                            selectable: this.isSelectable(dayNo, month, year)});
                    }

                    dayNo++;
                }
            }

            this.dates.push(week);
        }
    }

    prevMonth(event) {
        if(this.disabled) {
            event.preventDefault();
            return;
        }

        if(this.currentMonth === 0) {
            this.currentMonth = 11;
            this.currentYear--;
        }
        else {
            this.currentMonth--;
        }

        this.createMonth(this.currentMonth, this.currentYear);
        event.preventDefault();
    }

    nextMonth(event) {
        if(this.disabled) {
            event.preventDefault();
            return;
        }

        if(this.currentMonth === 11) {
            this.currentMonth = 0;
            this.currentYear++;
        }
        else {
            this.currentMonth++;
        }

        this.createMonth(this.currentMonth, this.currentYear);
        event.preventDefault();
    }

    onDateSelect(event,dateMeta,inputField) {
        if(this.disabled || !dateMeta.selectable) {
            event.preventDefault();
            inputField.focus();
            return;
        }

        if(dateMeta.otherMonth) {
            if(this.selectOtherMonths)
                this.selectDate(dateMeta);
        }
        else {
             this.selectDate(dateMeta);
        }

        this.dateClick = true;
        this.updateInputfield();
        event.preventDefault();
    }

    updateInputfield() {
        if(this.value) {
            let formattedValue;

            if(this.timeOnly) {
                formattedValue = this.formatTime(this.value);
            }
            else {
                formattedValue = this.formatDate(this.value, this.dateFormat);
                if(this.showTime) {
                    formattedValue += ' ' + this.formatTime(this.value);
                }
            }

            this.inputFieldValue = formattedValue;
        }
        else {
            this.inputFieldValue = '';
        }

        this.updateFilledState();
    }

    selectDate(dateMeta) {
        this.value = new Date(dateMeta.year, dateMeta.month, dateMeta.day);
        if(this.showTime) {
            if(this.hourFormat === '12' && this.pm && this.currentHour != 12)
                this.value.setHours(this.currentHour + 12);
            else
                this.value.setHours(this.currentHour);

            this.value.setMinutes(this.currentMinute);
            this.value.setSeconds(this.currentSecond);
        }
        this._isValid = true;
        this.updateModel();
        this.onSelect.emit(this.value);
    }

    updateModel() {
        if(this.dataType == 'date'){
            this.onModelChange(this.value);
        }
        else if(this.dataType == 'string') {
            if(this.timeOnly)
                this.onModelChange(this.formatTime(this.value));
            else
                this.onModelChange(this.formatDate(this.value, this.dateFormat));
        }
    }

    getFirstDayOfMonthIndex(month: number, year: number) {
        let day = new Date();
        day.setDate(1);
        day.setMonth(month);
        day.setFullYear(year);

        let dayIndex = day.getDay() + this.getSundayIndex();
        return dayIndex >= 7 ? dayIndex - 7 : dayIndex;
    }

    getDaysCountInMonth(month: number, year: number) {
        return 32 - this.daylightSavingAdjust(new Date(year, month, 32)).getDate();
    }

    getDaysCountInPrevMonth(month: number, year: number) {
        let prev = this.getPreviousMonthAndYear(month, year);
        return this.getDaysCountInMonth(prev.month, prev.year);
    }

    getPreviousMonthAndYear(month: number, year: number) {
        let m, y;

        if(month === 0) {
            m = 11;
            y = year - 1;
        }
        else {
            m = month - 1;
            y = year;
        }

        return {'month':m,'year':y};
    }

    getNextMonthAndYear(month: number, year: number) {
        let m, y;

        if(month === 11) {
            m = 0;
            y = year + 1;
        }
        else {
            m = month + 1;
        }

        return {'month':m,'year':y};
    }

    getSundayIndex() {
        return this.locale.firstDayOfWeek > 0 ? 7 - this.locale.firstDayOfWeek : 0;
    }

    isSelected(dateMeta): boolean {
        if(this.value)
            return this.value.getDate() === dateMeta.day && this.value.getMonth() === dateMeta.month && this.value.getFullYear() === dateMeta.year;
        else
            return false;
    }

    isToday(today, day, month, year): boolean {
        return today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
    }

    isSelectable(day, month, year): boolean {
        let validMin = true;
        let validMax = true;

        if(this.minDate) {
             if(this.minDate.getFullYear() > year) {
                 validMin = false;
             }
             else if(this.minDate.getFullYear() === year) {
                 if(this.minDate.getMonth() > month) {
                     validMin = false;
                 }
                 else if(this.minDate.getMonth() === month) {
                     if(this.minDate.getDate() > day) {
                         validMin = false;
                     }
                 }
             }
        }

        if(this.maxDate) {
             if(this.maxDate.getFullYear() < year) {
                 validMax = false;
             }
             else if(this.maxDate.getFullYear() === year) {
                 if(this.maxDate.getMonth() < month) {
                     validMax = false;
                 }
                 else if(this.maxDate.getMonth() === month) {
                     if(this.maxDate.getDate() < day) {
                         validMax = false;
                     }
                 }
             }
        }

        return validMin && validMax;
    }

    onInputFocus(inputfield, event) {
        this.focus = true;
        if(this.showOnFocus) {
            this.showOverlay(inputfield);
        }
        this.onFocus.emit(event);
    }

    onInputBlur(event) {
        this.focus = false;
        this.onBlur.emit(event);
        this.updateInputfield();
        this.onModelTouched();
    }

    onButtonClick(event,inputfield) {
        this.closeOverlay = false;

        if(!this.overlay.offsetParent) {
            inputfield.focus();
            this.showOverlay(inputfield);
        }
        else
            this.closeOverlay = true;
    }

    currentInput;
    onInputKeydown(inputfield, event) {
      // to be able to regain focus on the input from the calendar
      this.currentInput = inputfield;
      // Tab
      if (event.keyCode === 9) {
        this.overlayVisible = false;
      // Arrow Down
      } else if (event.keyCode === 40) {
        if (this.timeOnly) {
          event.srcElement.offsetParent.querySelectorAll('.ui-timepicker')[0].querySelectorAll('a')[0].focus();
        } else {
          event.srcElement.offsetParent.querySelectorAll('.ui-datepicker-today a')[0].focus();
        }
      }
    }

    onCalendarKeyDown(event) {
      var today, container, header, previousAnchor, nextAnchor, previousRowAnchors, currentAnchor, position, nodeList, row, rowList, isLast;
      switch (event.keyCode) {
        case 9: // tab
          this.overlayVisible = false;
          break;
        case 27: // espcape
          this.currentInput.focus();
          break;
        case 37: // arrow left
          event.preventDefault();
          previousAnchor = event.srcElement.offsetParent.previousElementSibling;
          if (previousAnchor) {
            previousAnchor.querySelectorAll('a')[0].focus();
            //  First cell in row
          } else if (event.srcElement.offsetParent.parentNode.previousElementSibling) {
            previousRowAnchors = event.srcElement.offsetParent.parentNode.previousElementSibling.querySelectorAll('a');
            previousRowAnchors[previousRowAnchors.length -1].focus();
          } else {
            //  First cell in table - Go into header
            container = event.srcElement.offsetParent.offsetParent.offsetParent;
            header = container.querySelectorAll('.ui-datepicker-header')[0];
            header.querySelectorAll('a')[header.querySelectorAll('a').length - 1].focus();
          }
          break;
        case 38 : // arrow up
            event.preventDefault();
            if (event.srcElement.offsetParent.parentNode.previousElementSibling) {
              nodeList = event.srcElement.offsetParent.parentNode.querySelectorAll('td a');
              position = Array.prototype.indexOf.call(nodeList, event.srcElement);
              event.srcElement.offsetParent.parentNode.previousElementSibling.querySelectorAll('a')[position].focus();
            } else {
              container = event.srcElement.offsetParent.offsetParent.offsetParent;
              header = container.querySelectorAll('.ui-datepicker-header')[0];
              header.querySelectorAll('a')[0].focus();
            }
          break;
        case 39 : // arrow right
          event.preventDefault();
          nextAnchor = event.srcElement.offsetParent.nextElementSibling;
          if (nextAnchor) {
            nextAnchor.querySelectorAll('a')[0].focus();
          //  Last cell in the row
          } else if (event.srcElement.offsetParent.parentNode.nextElementSibling) {
            event.srcElement.offsetParent.parentNode.nextElementSibling.querySelectorAll('a')[0].focus();
          //  Last cell in the table
          } else {
            if (this.showTime) {
              event.srcElement.offsetParent.offsetParent.offsetParent.querySelectorAll('.ui-timepicker')[0].querySelectorAll('a')[0].focus();
            } else {
              container = event.srcElement.offsetParent.offsetParent.offsetParent;
              header = container.querySelectorAll('.ui-datepicker-header')[0];
              header.querySelectorAll('a')[0].focus();
            }
          }
          break;
        case 40: // arrow down
          // determine if last row
          event.preventDefault();
          row = event.srcElement.parentNode.parentNode;
          rowList = event.srcElement.offsetParent.parentNode.parentNode.querySelectorAll('tr');
          isLast = Array.prototype.indexOf.call(rowList, row) === rowList.length - 1 ? true : false;
          if (isLast && this.showTime) {
            event.srcElement.offsetParent.offsetParent.offsetParent.querySelectorAll('.ui-timepicker')[0].querySelectorAll('a')[0].focus();
          } else if (!isLast) {
            nodeList = event.srcElement.offsetParent.parentNode.querySelectorAll('td a');
            position = Array.prototype.indexOf.call(nodeList, event.srcElement);
            event.srcElement.offsetParent.parentNode.nextElementSibling.querySelectorAll('a')[position].focus();
          }
          break;
      }
    }

    onHeaderKeyDown(event) {
      var selectors, nodeList, position, anchors;
      nodeList = event.srcElement.parentNode.querySelectorAll('a');
      position = Array.prototype.indexOf.call(nodeList, event.srcElement);
      switch (event.keyCode) {
        case 9: // tab
          this.overlayVisible = false;
          break;
        case 27: // espcape
          this.currentInput.focus();
          break;
        case 37: // arrow left
          event.preventDefault();
          if ((this.monthNavigator || this.yearNavigator) && position !== 0) {
            selectors = event.srcElement.offsetParent.querySelectorAll('select');
            selectors[selectors.length - 1].focus();
          } else if (position !== 0){
            event.srcElement.previousElementSibling.focus();
          } else {
            anchors = event.srcElement.offsetParent.offsetParent.querySelectorAll('td a');
            anchors[anchors.length - 1].focus();
          }
        break;
        case 39: // arrow right
          event.preventDefault();
          if ((this.monthNavigator || this.yearNavigator) && position + 1 !== nodeList.length) {
            event.srcElement.offsetParent.querySelectorAll('select')[0].focus();
          } else if (position + 1 !== nodeList.length){
            event.srcElement.nextElementSibling.focus();
          } else {
            event.srcElement.offsetParent.offsetParent.querySelectorAll('td a')[0].focus();
          }
        break;
        case 40: // arrow down
          event.preventDefault();
          event.srcElement.offsetParent.offsetParent.querySelectorAll('td a')[0].focus();
          break;
      }
    }

    onDropDownHeader(event) {
      var anchors, nodeList, position;
      switch (event.keyCode) {
        case 9: // tab
          this.overlayVisible = false;
          break;
        case 27: // espcape
          this.currentInput.focus();
          break;
        case 37: // arrow left
          event.preventDefault();
          nodeList = event.srcElement.offsetParent
          if (this.monthNavigator && this.yearNavigator && event.srcElement.previousElementSibling) {
            event.srcElement.previousElementSibling.focus();
          } else {
            event.srcElement.offsetParent.querySelectorAll('a')[0].focus();
          }
        break;
        case 39: // arrow right
          event.preventDefault();
          if (this.monthNavigator && this.yearNavigator && event.srcElement.nextElementSibling) {
            event.srcElement.nextElementSibling.focus();
          } else {
            anchors = event.srcElement.offsetParent.querySelectorAll('a');
            anchors[anchors.length - 1].focus();
          }
        break;
      }
    }

    onTimepikerKeyDown(event, type) {
      var position;
      var selector = '.ui-' + type + '-picker a';
      var anchorIndex = event.srcElement.offsetParent.querySelectorAll(selector)[0] === event.srcElement ? 0 : 1;
      if (anchorIndex === undefined) { anchorIndex = 0; }
      switch (event.keyCode) {
        case 9: // tab
          this.overlayVisible = false;
          break;
        case 27: // espcape
          this.currentInput.focus();
          break;
        case 37: // arrow left
          event.preventDefault();
          switch (type) {
            case 'hour':
              if (this.showSeconds) {
                event.srcElement.offsetParent.querySelectorAll('.ui-second-picker a')[anchorIndex].focus();
              } else {
                event.srcElement.offsetParent.querySelectorAll('.ui-minute-picker a')[anchorIndex].focus();
              }
            break;
            case 'minute':
              event.srcElement.offsetParent.querySelectorAll('.ui-hour-picker a')[anchorIndex].focus();
            break;
            case 'second':
                event.srcElement.offsetParent.querySelectorAll('.ui-minute-picker a')[anchorIndex].focus();
              break;
            };
          break;
        case 38: // arrow up
          event.preventDefault();
          if (anchorIndex === 0) {
            if (!this.timeOnly) {
              position = event.srcElement.offsetParent.offsetParent.querySelectorAll('table td a');
              position[position.length - 1].focus();
            } else {
              event.srcElement.parentNode.querySelectorAll('a')[1].focus();
            }
          } else {
            event.srcElement.parentNode.querySelectorAll('a')[0].focus();
          }
          break;
        case 39: // arrow right
          event.preventDefault();
          switch (type) {
            case 'hour':
              event.srcElement.offsetParent.querySelectorAll('.ui-minute-picker a')[anchorIndex].focus();
              break;
            case 'minute':
              if (this.showSeconds) {
                event.srcElement.offsetParent.querySelectorAll('.ui-second-picker a')[anchorIndex].focus();
              }
              else {
                event.srcElement.offsetParent.querySelectorAll('.ui-hour-picker a')[anchorIndex].focus();
              }
              break;
            case 'second':
              event.srcElement.offsetParent.querySelectorAll('.ui-hour-picker a')[anchorIndex].focus();
              break;
          }
          break;
        case 40: // arrow down
          event.preventDefault();
          if (anchorIndex === 0) {
            event.srcElement.parentNode.querySelectorAll('a')[1].focus();
          } else if (this.timeOnly) {
            event.srcElement.parentNode.querySelectorAll('a')[0].focus();
          }
          break;
      }
    }

    onMonthDropdownChange(m: string) {
        this.currentMonth = parseInt(m);
        this.createMonth(this.currentMonth, this.currentYear);
    }

    onYearDropdownChange(y: string) {
        this.currentYear = parseInt(y);
        this.createMonth(this.currentMonth, this.currentYear);
    }

    incrementHour(event) {
        let newHour = this.currentHour + this.stepHour;
        if(this.hourFormat == '24')
            this.currentHour = (newHour >= 24) ? (newHour - 24) : newHour;
        else if(this.hourFormat == '12')
            this.currentHour = (newHour >= 13) ? (newHour - 12) : newHour;

        this.updateTime();

        event.preventDefault();
    }

    decrementHour(event) {
        let newHour = this.currentHour - this.stepHour;
        if(this.hourFormat == '24')
            this.currentHour = (newHour < 0) ? (24 + newHour) : newHour;
        else if(this.hourFormat == '12')
            this.currentHour = (newHour <= 0) ? (12 + newHour) : newHour;

        this.updateTime();

        event.preventDefault();
    }

    incrementMinute(event) {
        let newMinute = this.currentMinute + this.stepMinute;
        this.currentMinute = (newMinute > 59) ? newMinute - 60 : newMinute;

        this.updateTime();

        event.preventDefault();
    }

    decrementMinute(event) {
        let newMinute = this.currentMinute - this.stepMinute;
        this.currentMinute = (newMinute < 0) ? 60 + newMinute : newMinute;

        this.updateTime();

        event.preventDefault();
    }

    incrementSecond(event) {
        let newSecond = this.currentSecond + this.stepSecond;
        this.currentSecond = (newSecond > 59) ? newSecond - 60 : newSecond;

        this.updateTime();

        event.preventDefault();
    }

    decrementSecond(event) {
        let newSecond = this.currentSecond - this.stepSecond;
        this.currentSecond = (newSecond < 0) ? 60 + newSecond : newSecond;

        this.updateTime();

        event.preventDefault();
    }

    updateTime() {
        this.value = this.value||new Date();
        if(this.hourFormat === '12' && this.pm && this.currentHour != 12)
            this.value.setHours(this.currentHour + 12);
        else
            this.value.setHours(this.currentHour);

        this.value.setMinutes(this.currentMinute);
        this.value.setSeconds(this.currentSecond);
        this.updateModel();
        this.onSelect.emit(this.value);
        this.updateInputfield();
    }

    toggleAMPM(event) {
        this.pm = !this.pm;
        this.updateTime();
        event.preventDefault();
    }

    onInput(event) {
        let val = event.target.value;

        try {
            this.value = this.parseValueFromString(val);
            this.updateUI();
            this._isValid = true;
        }
        catch(err) {
            //invalid date
            this.value = null;
            this._isValid = false;
        }

        this.updateModel();
        this.filled = val != null && val.length;
    }

    parseValueFromString(text: string): Date {
        let dateValue;
        let parts: string[] = text.split(' ');

        if(this.timeOnly) {
            dateValue = new Date();
            this.populateTime(dateValue, parts[0], parts[1]);
        }
        else {
            if(this.showTime) {
                dateValue = this.parseDate(parts[0], this.dateFormat);
                this.populateTime(dateValue, parts[1], parts[2]);
            }
            else {
                 dateValue = this.parseDate(text, this.dateFormat);
            }
        }

        return dateValue;
    }

    populateTime(value, timeString, ampm) {
        if(this.hourFormat == '12' && !ampm) {
            throw 'Invalid Time';
        }

        this.pm = (ampm === 'PM' || ampm === 'pm');
        let time = this.parseTime(timeString);
        value.setHours(time.hour);
        value.setMinutes(time.minute);
        value.setSeconds(time.second);
    }

    updateUI() {
        let val = this.value||this.defaultDate||new Date();
        this.createMonth(val.getMonth(), val.getFullYear());

        if(this.showTime||this.timeOnly) {
            let hours = val.getHours();

            if(this.hourFormat === '12') {
                if(hours >= 12) {
                    this.currentHour = (hours == 12) ? 12 : hours - 12;
                }
                else {
                    this.currentHour = (hours == 0) ? 12 : hours;
                }
            }
            else {
                this.currentHour = val.getHours();
            }

            this.currentMinute = val.getMinutes();
            this.currentSecond = val.getSeconds();
        }
    }

    onDatePickerClick(event) {
        this.closeOverlay = this.dateClick;
    }

    showOverlay(inputfield) {
        if(this.appendTo)
            this.domHandler.absolutePosition(this.overlay, inputfield);
        else
            this.domHandler.relativePosition(this.overlay, inputfield);

        this.overlayVisible = true;
        this.overlay.style.zIndex = String(++DomHandler.zindex);

        this.bindDocumentClickListener();
    }

    writeValue(value: any) : void {
        this.value = value;
        if(this.value && typeof this.value === 'string') {
            this.value = this.parseValueFromString(this.value);
        }

        this.updateInputfield();
        this.updateUI();
    }

    registerOnChange(fn: Function): void {
        this.onModelChange = fn;
    }

    registerOnTouched(fn: Function): void {
        this.onModelTouched = fn;
    }

    setDisabledState(val: boolean): void {
        this.disabled = val;
    }

    // Ported from jquery-ui datepicker formatDate
    formatDate(date, format) {
        if(!date) {
            return "";
        }

        let iFormat,
        lookAhead = (match) => {
            let matches = (iFormat + 1 < format.length && format.charAt(iFormat + 1) === match);
            if(matches) {
                iFormat++;
            }
            return matches;
        },
        formatNumber = (match, value, len) => {
            let num = "" + value;
            if(lookAhead(match)) {
                while (num.length < len) {
                    num = "0" + num;
                }
            }
            return num;
        },
        formatName = (match, value, shortNames, longNames) => {
            return (lookAhead(match) ? longNames[ value ] : shortNames[ value ]);
        },
        output = "",
        literal = false;

        if(date) {
            for(iFormat = 0; iFormat < format.length; iFormat++) {
                if(literal) {
                    if(format.charAt(iFormat) === "'" && !lookAhead("'"))
                        literal = false;
                    else
                        output += format.charAt(iFormat);
                }
                else {
                    switch (format.charAt(iFormat)) {
                        case "d":
                            output += formatNumber("d", date.getDate(), 2);
                            break;
                        case "D":
                            output += formatName("D", date.getDay(), this.locale.dayNamesShort, this.locale.dayNames);
                            break;
                        case "o":
                            output += formatNumber("o",
                                Math.round((new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000), 3);
                            break;
                        case "m":
                            output += formatNumber("m", date.getMonth() + 1, 2);
                            break;
                        case "M":
                            output += formatName("M", date.getMonth(), this.locale.monthNamesShort, this.locale.monthNames);
                            break;
                        case "y":
                            output += (lookAhead("y") ? date.getFullYear() :
                                (date.getFullYear() % 100 < 10 ? "0" : "") + date.getFullYear() % 100);
                            break;
                        case "@":
                            output += date.getTime();
                            break;
                        case "!":
                            output += date.getTime() * 10000 + this.ticksTo1970;
                            break;
                        case "'":
                            if(lookAhead("'"))
                                output += "'";
                            else
                                literal = true;

                            break;
                        default:
                            output += format.charAt(iFormat);
                    }
                }
            }
        }
        return output;
	}

    formatTime(date) {
        if(!date) {
            return '';
        }

        let output = '';
        let hours = date.getHours();
        let minutes = date.getMinutes();
        let seconds = date.getSeconds();

        if(this.hourFormat == '12' && this.pm && hours != 12) {
            hours-=12;
        }

        output += (hours < 10) ? '0' + hours : hours;
        output += ':';
        output += (minutes < 10) ? '0' + minutes : minutes;

        if(this.showSeconds) {
            output += ':';
            output += (seconds < 10) ? '0' + seconds : seconds;
        }

        if(this.hourFormat == '12') {
            output += this.pm ? ' PM' : ' AM';
        }

        return output;
    }

    parseTime(value) {
        let tokens: string[] = value.split(':');
        let validTokenLength = this.showSeconds ? 3 : 2;

        if(tokens.length !== validTokenLength) {
            throw "Invalid time";
        }

        let h = parseInt(tokens[0]);
        let m = parseInt(tokens[1]);
        let s = this.showSeconds ? parseInt(tokens[2]) : null;

        if(isNaN(h) || isNaN(m) || h > 23 || m > 59 || (this.hourFormat == '12' && h > 12) || (this.showSeconds && (isNaN(s) || s > 59))) {
            throw "Invalid time";
        }
        else {
            if(this.hourFormat == '12' && h !== 12 && this.pm) {
                h+= 12;
            }

            return {hour: h, minute: m, second: s};
        }
    }

    // Ported from jquery-ui datepicker parseDate
    parseDate(value, format) {
		if(format == null || value == null) {
			throw "Invalid arguments";
		}

		value = (typeof value === "object" ? value.toString() : value + "");
		if(value === "") {
			return null;
		}

		let iFormat, dim, extra,
		iValue = 0,
		shortYearCutoff = (typeof this.shortYearCutoff !== "string" ? this.shortYearCutoff : new Date().getFullYear() % 100 + parseInt(this.shortYearCutoff, 10)),
		year = -1,
		month = -1,
		day = -1,
		doy = -1,
		literal = false,
		date,
		lookAhead = (match) => {
			let matches = (iFormat + 1 < format.length && format.charAt(iFormat + 1) === match);
			if(matches) {
				iFormat++;
			}
			return matches;
		},
		getNumber = (match) => {
			let isDoubled = lookAhead(match),
				size = (match === "@" ? 14 : (match === "!" ? 20 :
				(match === "y" && isDoubled ? 4 : (match === "o" ? 3 : 2)))),
				minSize = (match === "y" ? size : 1),
				digits = new RegExp("^\\d{" + minSize + "," + size + "}"),
				num = value.substring(iValue).match(digits);
			if(!num) {
				throw "Missing number at position " + iValue;
			}
			iValue += num[ 0 ].length;
			return parseInt(num[ 0 ], 10);
		},
		getName = (match, shortNames, longNames) => {
            let index = -1;
            let arr = lookAhead(match) ? longNames : shortNames;
            let names = [];

            for(let i = 0; i < arr.length; i++) {
                names.push([i,arr[i]]);
            }
            names.sort((a,b) => {
                return -(a[ 1 ].length - b[ 1 ].length);
            });

            for(let i = 0; i < names.length; i++) {
                let name = names[i][1];
                if(value.substr(iValue, name.length).toLowerCase() === name.toLowerCase()) {
    				index = names[i][0];
    				iValue += name.length;
    				break;
    			}
            }

			if(index !== -1) {
				return index + 1;
			} else {
				throw "Unknown name at position " + iValue;
			}
		},
		checkLiteral = () => {
			if(value.charAt(iValue) !== format.charAt(iFormat)) {
				throw "Unexpected literal at position " + iValue;
			}
			iValue++;
		};

		for (iFormat = 0; iFormat < format.length; iFormat++) {
			if(literal) {
				if(format.charAt(iFormat) === "'" && !lookAhead("'")) {
					literal = false;
				} else {
					checkLiteral();
				}
			} else {
				switch (format.charAt(iFormat)) {
					case "d":
						day = getNumber("d");
						break;
					case "D":
						getName("D", this.locale.dayNamesShort, this.locale.dayNames);
						break;
					case "o":
						doy = getNumber("o");
						break;
					case "m":
						month = getNumber("m");
						break;
					case "M":
						month = getName("M", this.locale.monthNamesShort, this.locale.monthNames);
						break;
					case "y":
						year = getNumber("y");
						break;
					case "@":
						date = new Date(getNumber("@"));
						year = date.getFullYear();
						month = date.getMonth() + 1;
						day = date.getDate();
						break;
					case "!":
						date = new Date((getNumber("!") - this.ticksTo1970) / 10000);
						year = date.getFullYear();
						month = date.getMonth() + 1;
						day = date.getDate();
						break;
					case "'":
						if(lookAhead("'")) {
							checkLiteral();
						} else {
							literal = true;
						}
						break;
					default:
						checkLiteral();
				}
			}
		}

		if(iValue < value.length) {
			extra = value.substr(iValue);
			if(!/^\s+/.test(extra)) {
				throw "Extra/unparsed characters found in date: " + extra;
			}
		}

		if(year === -1) {
			year = new Date().getFullYear();
		} else if(year < 100) {
			year += new Date().getFullYear() - new Date().getFullYear() % 100 +
				(year <= shortYearCutoff ? 0 : -100);
		}

		if(doy > -1) {
			month = 1;
			day = doy;
			do {
				dim = this.getDaysCountInMonth(year, month - 1);
				if(day <= dim) {
					break;
				}
				month++;
				day -= dim;
			} while (true);
		}

		date = this.daylightSavingAdjust(new Date(year, month - 1, day));
		if(date.getFullYear() !== year || date.getMonth() + 1 !== month || date.getDate() !== day) {
			throw "Invalid date"; // E.g. 31/02/00
		}
		return date;
	}

    daylightSavingAdjust(date) {
        if(!date) {
            return null;
        }
        date.setHours(date.getHours() > 12 ? date.getHours() + 2 : 0);
        return date;
    }

    updateFilledState() {
        this.filled = this.inputFieldValue && this.inputFieldValue != '';
    }

    bindDocumentClickListener() {
        if(!this.documentClickListener) {
            this.documentClickListener = this.renderer.listenGlobal('body', 'click', () => {
                if(this.closeOverlay) {
                    this.overlayVisible = false;
                }

                this.closeOverlay = true;
                this.dateClick = false;
            });
        }
    }

    unbindDocumentClickListener() {
        if(this.documentClickListener) {
            this.documentClickListener();
        }
    }

    ngOnDestroy() {
        this.unbindDocumentClickListener();

        if(!this.inline && this.appendTo) {
            this.el.nativeElement.appendChild(this.overlay);
        }
    }

    validate(c: AbstractControl) {
        if (!this._isValid) {
            return { invalidDate: true };
        }

        return null;
    }
}

@NgModule({
    imports: [CommonModule,ButtonModule,InputTextModule],
    exports: [Calendar,ButtonModule,InputTextModule],
    declarations: [Calendar]
})
export class CalendarModule { }

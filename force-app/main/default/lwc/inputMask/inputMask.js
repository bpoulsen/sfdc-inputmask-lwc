import {LightningElement, api, wire} from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';
import { updateRecord } from 'lightning/uiRecordApi';
import { phoneMask } from 'c/inputMaskUtils';

import ID_FIELD from '@salesforce/schema/Contact.Id';
import FIRSTNAME_FIELD from '@salesforce/schema/Contact.FirstName';
import LASTNAME_FIELD from '@salesforce/schema/Contact.LastName';
import PHONE_FIELD from '@salesforce/schema/Contact.Phone';
import {ShowToastEvent} from "lightning/platformShowToastEvent";

const FIELDS = ['Contact.FirstName', 'Contact.LastName', 'Contact.Phone'];

export default class InputMask extends LightningElement {

    @api recordId;

    contact;
    error;
    phone;

    @wire(getRecord, { recordId: '$recordId', fields: FIELDS })
    wiredRecord({ error, data }) {
        if (error) {
            let message = 'Unknown error';
            if (Array.isArray(error.body)) {
                message = error.body.map(e => e.message).join(', ');
            } else if (typeof error.body.message === 'string') {
                message = error.body.message;
            }
            this.showToast('Error loading contact', message, 'error');
        } else if (data) {
            this.contact = data;
            this.phone = phoneMask(data.fields.Phone.value); // add mask to phone value
        }
    }

    /**
     * validate all required fields and create recordInput object
     */
    save() {
        const allValid = [...this.template.querySelectorAll('lightning-input')]
            .reduce((validSoFar, inputFields) => {
                inputFields.reportValidity();
                return validSoFar && inputFields.checkValidity();
            }, true);

        if (allValid) {

            // Create the recordInput object
            const fields = {};
            fields[ID_FIELD.fieldApiName] = this.recordId;
            fields[FIRSTNAME_FIELD.fieldApiName] = this.template.querySelector("[data-field='FirstName']").value;
            fields[LASTNAME_FIELD.fieldApiName] = this.template.querySelector("[data-field='LastName']").value;
            fields[PHONE_FIELD.fieldApiName] = this.template.querySelector("[data-field='Phone']").value.replace(/\D/g,''); // remove mask from phone value

            const recordInput = { fields };

            updateRecord(recordInput)
                .then(() => {
                    // save success
                    this.showToast('Record updated!', 'This record was updated successfully.');
                })
                .catch(error => {
                    this.showToast('Error updating record',error, 'error');
                });
        }
        else {
            // The form is not valid
            this.showToast('Something is wrong', 'Please check your input for missing or incorrect information.', 'error');
        }
    }

    /**
     * formats lightning-input as US phone with area code (###) ###-####
     * @param event
     */
    handlePhoneInputMask(event) {
        event.target.value = phoneMask(event.target.value);
    }

    showToast(title, message, variant = 'success') {
        this.dispatchEvent(
            new ShowToastEvent({
                title: title,
                message: message,
                variant: variant
            })
        );
    }
}
import React from 'react'
import { graphql } from 'gatsby'
import { RadioGroup, Radio } from 'react-radio-group'
import { Card as CardSecure } from '../../Ui/Secure'
import Gifts from './gifts.js'
import Amounts from './amounts.js'
import { injectStripe, StripeProvider, Elements, CardElement } from 'react-stripe-elements';
import Script from 'react-load-script'
import WithTracking from '../../Track'
import axios from 'axios'
import './index.sass'

export const DonationFrequencies = Object.freeze({OneTime: 'onetime', Monthly: 'monthly'});

class _DonationFormInner extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            frequency: this.props.defaultType || 'onetime',
            amount: this.props.defaultAmounts.length > 1 ? this.props.defaultAmounts[1] : null,
            reward: null,
            firstName: '',
            lastName: '',
            email: '',
            address1: '',
            city: '',
            state: '',
            zip: '',
            cardComplete: false,
            loading: false,
        }
    }
    
    render() {
        return (
            <div className="donation-form">

                <section className="amount">
                    <h3>{this.props.translate('layout.block.donation-form.amount')}</h3>
                    <span className="frequency">
                        {this.props.hideFrequency ? '' : (
                            <RadioGroup selectedValue={this.state.frequency} onChange={(val) => this.setState({frequency: val})} name="donate-frequency">
                                <Radio value={DonationFrequencies.OneTime} /> {this.props.translate('layout.block.donation-form.frequency.onetime')}
                                <Radio value={DonationFrequencies.Monthly} /> {this.props.translate('layout.block.donation-form.frequency.monthly')}
                            </RadioGroup>
                        )}
                    </span>
                    <Amounts
                        amounts={this.props.defaultAmounts}
                        onChange={(val) => this.setState({amount: val})}
                        selectedValue={this.state.amount}
                        frequency={this.state.frequency}
                        translate={this.props.translate}
                    />
                </section>

                {this.props.gifts ? (
                    <section className="reward">
                        <h3>{this.props.translate('layout.block.donation-form.gift')}</h3>
                        <Gifts
                            onChange={(val) => this.setState({reward: val})}
                            selectedValue={this.state.reward}
                            gifts={this.props.gifts}
                            amount={this.state.amount}
                            frequency={this.state.frequency}
                        />
                    </section>
                ): ''}

                <section className="contact">
                    <h3>{this.props.translate('layout.block.donation-form.payment')}</h3>
                    <CardElement style={this.stripeDesign()} onChange={(e) => this.setState({cardComplete: e.complete})} />
                    <section className="basic">
                        <input name="first_name" placeholder={this.props.translate('field.first_name')} type="text"
                            onChange={(e) => this.setState({firstName: e.target.value})} value={this.state.firstName} />
                        <input name="last_name" placeholder={this.props.translate('field.last_name')} type="text"
                            onChange={(e) => this.setState({lastName: e.target.value})} value={this.state.lastName} />
                        <input name="email" placeholder={this.props.translate('field.email')} type="email"
                            onChange={(e) => this.setState({email: e.target.value})} value={this.state.email} />
                    </section>
                    {this.state.reward ? (
                        <section className="address">
                            <input name="address_1" placeholder={this.props.translate('field.address')} type="text"
                                    onChange={(e) => this.setState({address1: e.target.value})} value={this.state.address1} />
                                <input name="city" placeholder={this.props.translate('field.city')} type="text"
                                    onChange={(e) => this.setState({city: e.target.value})} value={this.state.city} />
                                <input name="state" placeholder={this.props.translate('field.state')} type="text"
                                    onChange={(e) => this.setState({state: e.target.value})} value={this.state.state} />
                                <input name="zip" placeholder={this.props.translate('field.zip')} type="text"
                                    onChange={(e) => this.setState({zip: e.target.value})} value={this.state.zip} />
                        </section>
                    ) : ''}
                </section>

                <section className="submit">
                    <input type="submit"
                        disabled={!this.validate()}
                        value={(!this.validate()
                                ? (
                                    this.state.loading ? '...' : this.props.translate('layout.block.donation-form.submit.missing')
                                )
                                : this.props.translate('layout.block.donation-form.submit.'+this.state.frequency))
                                .replace(':amount', '$'+this.state.amount)}
                        onClick={() => this.onSubmit()}
                    />
                </section>
                <CardSecure />
            </div>
        )
    }

    componentDidUpdate() {
        if (!this.state.reward && (this.state.address1 || this.state.city || this.state.state || this.state.zip)) {
            this.setState({
                address1: '',
                city: '',
                state: '',
                zip: ''
            });
        }
    }

    validate() {
        return ( true
            && (this.state.frequency && Object.keys(DonationFrequencies).map((x)=>DonationFrequencies[x]).indexOf(this.state.frequency) > -1)
            && (this.state.amount && this.state.amount > 0)
            && (this.state.firstName && this.state.lastName && this.state.email && this.isEmail(this.state.email))
            && (!this.state.reward || (this.state.address1 && this.state.city && this.state.state && this.state.zip))
            && this.state.cardComplete
            && !this.state.loading
        );
    }

    isEmail(email) {
        // eslint-disable-next-line
        var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    }

    onSubmit() {
        if (!this.validate) return;
        this.setState({loading: true});

        this.props.stripe.createToken({name: `${this.state.firstName} ${this.state.lastName}`}).then(({ token }) => {
            return axios.post(process.env.GATSBY_API_DONATE, {
                amount: this.state.amount,
                frequency: this.state.frequency,
                gift: this.state.reward,
                token: token.id,
                currency: 'USD', //TODO(@tylermenezes)
                contact: {
                    firstName: this.state.firstName,
                    lastName: this.state.lastName,
                    email: this.state.email,
                    address: this.state.address1,
                    city: this.state.city,
                    state: this.state.state,
                    zip: this.state.zip,
                },
            })
        }).then((result) => {
                window.location = result.data.receipt;
        }).catch((err) => {
            if (err.response && err.response.data && err.response.data.err)
                alert(err.response.data.err);
            else alert(err.message);
            this.setState({loading: false});
        });
    }

    stripeDesign() {
        return {
            base: {
                fontFamily: '"Avenir Next", "Helvetica", "Arial", sans-serif',
                fontSize: '13.3333px',
                color: '#484848',
                iconColor: '#bdbdbd',
                '::placeholder': {
                    color: '#bdbdbd'
                }
            },
            invalid: {
                color: '#ff686b'
            }
        };
    }
}
const DonationFormInner = WithTracking(_DonationFormInner);

class DonationForm extends React.Component {
    constructor(props) {
        super(props);
        this.state = {stripe: null};
    }
    render() {
        const WrappedDonationForm = injectStripe(DonationFormInner);
        return (
            <div>
                <Script url="https://js.stripe.com/v3/"
                    onError={() => {}}
                    onLoad={() => this.setState({stripe: window.Stripe(process.env.GATSBY_STRIPE_PUBLIC)})} />
                {this.state.stripe ? (
                    <StripeProvider stripe={this.state.stripe}>
                        <Elements fonts={[{cssSrc: 'https://f1.srnd.org/fonts/avenir-next/minimal.css'}]} locale="en-US">
                            <WrappedDonationForm {...this.props} />
                        </Elements>
                    </StripeProvider>) : ''}
            </div>
        );
    }
}
export default DonationForm;

export const query = graphql`
    fragment DonationFormBlockItems on ContentfulLayoutBlockDonationForm {
        defaultType
        hideFrequency
        defaultAmounts
        gifts {
            ...GiftItems
        }
    }
`;

import React from 'react'
import { graphql } from 'gatsby'
import reactReplace from 'react-string-replace'

import Sponsors from '../../Fragments/Sponsors'
import Programs from '../../Fragments/Programs'
import DonationMatch from '../../Fragments/DonationMatch'
import TrackingControl from '../../Fragments/TrackingControl'
import ProgramMap from '../../Fragments/ProgramMap'

export default class HtmlBlock extends React.Component {
    render() {
        return (
            <div>
                <div className="html">{this.renderHtml()}</div>
            </div>
        );
    }

    renderHtml() {
        // TODO(@tylermenezes): Weird bug where react doubles all replacements when rehydrating if the replaced
        //                      component isn't the last in the array.
        const replace = {
            '<Sponsors type="small" />': <Sponsors type="small" />,
            '<Programs />': <Programs />,
            '<TrackingControl />': <TrackingControl />,
            '<DonationMatch />': <DonationMatch />,
            '<ProgramMap />': <ProgramMap />,
        };

        var result = this.props.html.html;
        Object.keys(replace).map((k) => { result = reactReplace(result, k, () => replace[k]); return null; });
        return result.map((x) => typeof(x) === 'string' ? <div dangerouslySetInnerHTML={{__html: x}} /> : x);
    }
}

export const query = graphql`
    fragment HtmlBlockItems on ContentfulLayoutBlockHtml {
        allowReact
        html {
            html
        }
    }
`;

'use strict';

const React = require('react');
const autoBind = require('../../util/autoBind.js');

class ListInput extends React.Component {
    constructor(props) {
        super(props);
        autoBind(this);

        this.state = {
            values: []
        };
    }

    componentWillReceiveProps(props) {
        if (typeof props.value !== 'undefined') {
            this.setState({ value: props.value });
        }
    }

    render() {
        let options = this.props.options.map((item, index) => {
            return (
                <option key={index} value={item.value}>{item.text}</option>
            );
        });

        return (
            <select name={this.props.name} className="input-field input-list" multiple="true">
                {options}
            </select>
        );
    }
}

ListInput.defaultProps = {
    name: 'list',
    options: []
};

module.exports = ListInput;
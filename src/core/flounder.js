
import { defaultOptions }   from './defaults';
import utils                from './utils';
import api                  from './api';
import build                from './build';
import events               from './events';
import Search               from './search';
import version              from './version';


class Flounder
{
    /**
     * ## addNoMoreOptionsMessage
     *
     * Adding 'No More Options' message to the option list
     *
     * @return _Void_
     */
    addNoMoreOptionsMessage( )
    {
        let classes     = this.classes;
        let noMoreOptionsEl = this.refs.noMoreOptionsEl || utils.constructElement( { className : classes.NO_RESULTS } );

        noMoreOptionsEl.innerHTML = this.props.noMoreOptionsText !== undefined ? this.props.noMoreOptionsText : defaultOptions.noMoreOptionsText;
        this.refs.optionsList.appendChild( noMoreOptionsEl );

        this.refs.noMoreOptionsEl = noMoreOptionsEl;
    }


    /**
     * ## addNoResultsMessage
     *
     * Adding 'No Results' message to the option list
     *
     * @return _Void_
     */
    addNoResultsMessage( )
    {
        let classes     = this.classes;
        let noResultsEl = this.refs.noResultsEl || utils.constructElement( { className : classes.NO_RESULTS } );

        noResultsEl.innerHTML = this.props.noResultsText !== undefined ? this.props.noResultsText : defaultOptions.noResultsText;
        this.refs.optionsList.appendChild( noResultsEl );

        this.refs.noResultsEl = noResultsEl;
    }


    /**
     * ## arrayOfFlounders
     *
     * called when a jquery object, microbe, or array is fed into flounder
     * as a target
     *
     * @param {DOMElement} target flounder mount point
     * @param {Object} props passed options
     *
     * @return {Array} array of flounders
     */
    arrayOfFlounders( targets, props )
    {
        return Array.prototype.slice.call( targets, 0 ).map( ( el, i ) => new this.constructor( el, props ) );
    }


    /**
     * ## componentWillUnmount
     *
     * on unmount, removes events
     *
     * @return _Void_
     */
    componentWillUnmount()
    {
        try
        {
            this.onComponentWillUnmount();
        }
        catch( e )
        {
            console.warn( `something may be wrong in "onComponentWillUnmount"`, e );
        }

        this.removeListeners();

        if ( this.originalChildren )
        {
            this.popInSelectElements( this.refs.select );
        }
    }


    /**
     * ## constructor
     *
     * main constuctor
     *
     * @param {DOMElement} target flounder mount point
     * @param {Object} props passed options
     *
     * @return _Object_ new flounder object
     */
    constructor( target, props )
    {
        if ( !target && !props )
        {
            return this.constructor;
        }
        else if ( target )
        {
            if ( typeof target === `string` )
            {
                target = document.querySelectorAll( target );
            }
            if ( target.length && target.tagName !== `SELECT` )
            {
                return this.arrayOfFlounders( target, props );
            }
            else if ( ( !target.length && target.length !== 0 ) || target.tagName === `SELECT` )
            {
                if ( target.flounder )
                {
                    target.flounder.destroy();
                }

                this.props = props;
                this.bindThis();
                this.initializeOptions();
                this.setTarget( target );

                if ( this.search )
                {
                    this.search = new Search( this );
                }

                try
                {
                    this.onInit();
                }
                catch( e )
                {
                    console.warn( `something may be wrong in "onInit"`, e );
                }
                this.buildDom();
                let { isOsx, isIos, multiSelect } = utils.setPlatform();
                this.isOsx          = isOsx;
                this.isIos          = isIos;
                this.multiSelect    = multiSelect;
                this.onRender();

                try
                {
                    this.onComponentDidMount();
                }
                catch( e )
                {
                    console.warn( `something may be wrong in "onComponentDidMount"`, e );
                }

                this.ready = true;

                return this.refs.flounder.flounder = this.originalTarget.flounder = this.target.flounder = this;
            }
        }
    }


    /**
     * ## displayMultipleTags
     *
     * handles the display and management of tags
     *
     * @param  {Array} selectedOptions currently selected options
     * @param  {DOMElement} selected div to display currently selected options
     *
     * @return _Void_
     */
    displayMultipleTags( selectedOptions, multiTagWrapper )
    {
        let span, a;

        let removeMultiTag = this.removeMultiTag;

        Array.prototype.slice.call( multiTagWrapper.children, 0 ).forEach( function( el )
        {
            if( el.firstChild )
            {
                el.firstChild.removeEventListener( `click`, removeMultiTag );
            }
        } );

        this.removeSearchListeners();

        multiTagWrapper.innerHTML = ``;

        if ( selectedOptions.length > 0 )
        {
            let classes = this.classes;

            selectedOptions.forEach( function( option )
            {
                if ( option.value !== `` )
                {
                    let span        = document.createElement( `span` )
                    span.className  = classes.MULTIPLE_SELECT_TAG;

                    let a           = document.createElement( `a` )
                    a.className     = classes.MULTIPLE_TAG_CLOSE;
                    a.setAttribute( `data-index`, option.index );

                    span.appendChild( a );

                    span.innerHTML += option.innerHTML;

                    multiTagWrapper.appendChild( span );
                }
                else
                {
                    option.selected = false;
                }
            } );

            Array.prototype.slice.call( multiTagWrapper.children, 0 ).forEach( function( el )
            {
                if( el.firstChild )
                {
                    el.firstChild.addEventListener( `click`, removeMultiTag );
                }
            } );
        }
        else
        {
            this.addPlaceholder();
        }


        this.refs.search = this.addSearch( multiTagWrapper );
        this.addSearchListeners();
    }


    /**
     * ## displaySelected
     *
     * formats and displays the chosen options
     *
     * @param {DOMElement} selected display area for the selected option(s)
     * @param {Object} refs element references
     *
     * @return _Void_
     */
    displaySelected( selected, refs )
    {
        let value = [];
        let index = -1;

        let selectedOption  = this.getSelected();
        let selectedLength  = selectedOption.length;
        let multipleTags    = this.multipleTags;

        if ( !multipleTags && selectedLength ===  1 )
        {
            index               = selectedOption[0].index;
            selected.innerHTML  = refs.data[ index ].innerHTML;
            value               = selectedOption[0].value;
        }
        else if ( !multipleTags && selectedLength === 0 )
        {
            let defaultValue    = this._default;
            index               = defaultValue.index || -1;
            selected.innerHTML  = defaultValue.text;
            value               = defaultValue.value;
        }
        else
        {
            if ( multipleTags )
            {
                selected.innerHTML  = ``;
                this.displayMultipleTags( selectedOption, refs.multiTagWrapper );
            }
            else
            {
                selected.innerHTML  = this.multipleMessage;
            }

            index = selectedOption.map( option => option.index );
            value = selectedOption.map( option => option.value );
        }

        selected.setAttribute( `data-value`, value );
        selected.setAttribute( `data-index`, index );
    }


    /**
     * ## fuzzySearch
     *
     * searches for things
     *
     * @param {Object} e event object
     *
     * @return _Void_
     */
    fuzzySearch( e )
    {
        this.lastSearchEvent = e;

        try
        {
            this.onInputChange( e );
        }
        catch( e )
        {
            console.warn( `something may be wrong in "onInputChange"`, e );
        }

        if ( !this.toggleList.justOpened )
        {
            e.preventDefault();
            let keyCode = e.keyCode;

            if ( keyCode !== 38 && keyCode !== 40 &&
                    keyCode !== 13 && keyCode !== 27 )
            {
                let val = e.target.value.trim();

                let matches = this.search.isThereAnythingRelatedTo( val );

                let selectedValues = this.refs.selected.getAttribute( `data-value` ).split( ',' );

                if( matches )
                {
                    let filteredMatches = matches.filter( ( match, i ) =>
                                            {
                                                if( selectedValues.indexOf( match.d.value ) === -1 )
                                                {
                                                    return match;
                                                }
                                            });

                    let data    = this.refs.data;
                    let classes = this.classes;

                    data.forEach( ( el, i ) =>
                    {
                        utils.addClass( el, classes.SEARCH_HIDDEN );
                    } );

                    matches.forEach( e =>
                    {
                        utils.removeClass( data[ e.i ], classes.SEARCH_HIDDEN );
                    } );

                    if( !this.refs.noMoreOptionsEl )
                    {

                        if( filteredMatches.length === 0 && val.length !== 0 )
                        {
                            this.addNoResultsMessage();
                        }
                        else
                        {
                            this.removeNoResultsMessage();
                        }
                    }
                }
                else
                {
                    this.fuzzySearchReset();
                }
            }
            else if ( keyCode === 27 )
            {
                this.fuzzySearchReset();
                this.toggleList( e, `close` );
                this.addPlaceholder();
            }
            else
            {
                this.setSelectValue( e );
                this.setKeypress( e );
            }
        }
        else
        {
            this.toggleList.justOpened = false;
        }
    }


    /**
     * ## fuzzySearchReset
     *
     * resets all options to visible
     *
     * @return _Void_
     */
    fuzzySearchReset()
    {
        let refs    = this.refs;
        let classes = this.classes;

        refs.data.forEach( dataObj =>
        {
            utils.removeClass( dataObj, classes.SEARCH_HIDDEN );
        } );

        refs.search.value = ``;
        this.removeNoResultsMessage();
    }


    /**
     * ## initializeOptions
     *
     * inserts the initial options into the flounder object, setting defaults
     * when necessary
     *
     * @return _Void_
     */
    initializeOptions()
    {
        let props = this.props = this.props || {};

        for ( let opt in defaultOptions )
        {
            if ( defaultOptions.hasOwnProperty( opt ) )
            {
                if ( opt === `classes` )
                {
                    this.classes       = {};
                    let defaultClasses = defaultOptions[ opt ];
                    let propClasses    = typeof props[ opt ] === `object` ? props[ opt ] : {};

                    for ( let clss in defaultClasses )
                    {
                        this.classes[ clss ] = propClasses[ clss ] ? propClasses[ clss ] : defaultClasses[ clss ];
                    }
                }
                else
                {
                    this[ opt ] = props[ opt ] !== undefined ? props[ opt ] : defaultOptions[ opt ];
                }
            }
        }

        this.selectedClass = this.classes.SELECTED;

        if ( props.defaultEmpty )
        {
            this.placeholder = ``;
        }

        if ( this.multipleTags )
        {
            this.search         = true;
            this.multiple       = true;
            this.selectedClass  += `  ${this.classes.SELECTED_HIDDEN}`;

            if ( !this.placeholder )
            {
                this.placeholder = defaultOptions.placeholder;
            }
        }
    }


    /**
     * ## onRender
     *
     * attaches necessary events to the built DOM
     *
     * @return _Void_
     */
    onRender()
    {
        let props   = this.props;
        let refs    = this.refs;
        let data    = refs.data;

        if ( !!this.isIos && ( !this.multipleTags || !this.multiple )  )
        {
            let sel     = refs.select;
            let classes = this.classes;
            utils.removeClass( sel, classes.HIDDEN );
            utils.addClass( sel, classes.HIDDEN_IOS );
        }

        this.addListeners( refs, props );
    }


    /**
     * ## removeMultiTag
     *
     * removes a multi selection tag on click; fixes all references to value and state
     *
     * @param  {Object} e event object
     *
     * @return _Void_
     */
    removeMultiTag( e )
    {
        e.preventDefault();
        e.stopPropagation();

        let value;
        let index;
        let classes         = this.classes;
        let refs            = this.refs;
        let select          = refs.select;
        let selected        = refs.selected;
        let target          = e.target;
        let defaultValue    = this._default;
        let data            = this.refs.data;
        let targetIndex     = target.getAttribute( `data-index` );
        select[ targetIndex ].selected = false;

        let selectedOptions = this.getSelected();

        refs.search.value = ``;

        utils.removeClass( data[ targetIndex ], classes.SELECTED_HIDDEN );
        utils.removeClass( data[ targetIndex ], classes.SELECTED );

        target.removeEventListener( `click`, this.removeMultiTag );

        let span = target.parentNode;
        span.parentNode.removeChild( span );

        if ( selectedOptions.length === 0 )
        {
            this.addPlaceholder();
            index               = -1;
            value               = ``;
        }
        else
        {
            value = selectedOptions.map( function( option )
            {
                return option.value;
            } );

            index = selectedOptions.map( function( option )
            {
                return option.index;
            } );
        }

        this.removeNoMoreOptionsMessage();
        this.removeNoResultsMessage();

        if( this.lastSearchEvent  )
        {
            this.fuzzySearch( this.lastSearchEvent );
            this.removeNoResultsMessage();
            this.removeNoMoreOptionsMessage();
        }

        selected.setAttribute( `data-value`, value );
        selected.setAttribute( `data-index`, index );

        try
        {
            this.onSelect( e, this.getSelectedValues() );
        }
        catch( e )
        {
            console.warn( `something may be wrong in "onSelect"`, e );
        }
    }


    /**
     * ## removeNoResultsMessage
     *
     * Removing 'No Results' message from the option list
     *
     * @return _Void_
     */
    removeNoResultsMessage()
    {
        let noResultsEl =  this.refs.noResultsEl;

        if( this.refs.optionsList && noResultsEl )
        {
            this.refs.optionsList.removeChild( noResultsEl );
            this.refs.noResultsEl = undefined;
        }
    }

    /**
     * ## removeNoMoreOptionsMessage
     *
     * Removing 'No More options' message from the option list
     *
     * @return _Void_
     */
    removeNoMoreOptionsMessage()
    {
        let noMoreOptionsEl =  this.refs.noMoreOptionsEl;

        if( this.refs.optionsList && noMoreOptionsEl )
        {
            this.refs.optionsList.removeChild( noMoreOptionsEl );
            this.refs.noMoreOptionsEl = undefined;
        }
    }


    /**
     * ## removeSelectedClass
     *
     * removes the [[this.selectedClass]] from all data
     *
     * @return _Void_
     */
    removeSelectedClass( data )
    {
        data = data || this.refs.data;

        data.forEach( ( dataObj, i ) =>
        {
            utils.removeClass( dataObj, this.selectedClass );
        } );
    }


    /**
     * ## removeSelectedValue
     *
     * sets the selected property to false for all data
     *
     * @return _Void_
     */
    removeSelectedValue( data )
    {
        data = data || this.refs.data;

        data.forEach( ( d, i ) =>
        {
            this.refs.select[ i ].selected = false;
        } );
    }


    /**
     * ## sortData
     *
     * checks the data object for header options, and sorts it accordingly
     *
     * @return _Boolean_ hasHeaders
     */
    sortData( data, res = [], i = 0 )
    {
        data.forEach( d =>
        {
            if ( d.header )
            {
                res = this.sortData( d.data, res, i );
            }
            else
            {
                if ( typeof d !== `object` )
                {
                    d = {
                        text    : d,
                        value   : d,
                        index   : i
                    };
                }
                else
                {
                    d.index = i;
                }

                res.push( d );
                i++;
            }
        } );

        return res;
    }
}


/**
 * ## version
 *
 * sets version with getters and no setters for the sake of being read-only
 */
Object.defineProperty( Flounder, `version`, {
    get : function()
    {
        return version;
    }
} );

Object.defineProperty( Flounder.prototype, `version`, {
    get : function()
    {
        return version;
    }
} );

utils.extendClass( Flounder, api, build, events );

export default Flounder;


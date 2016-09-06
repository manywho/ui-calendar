/*!
 Copyright 2015 ManyWho, Inc.
 Licensed under the ManyWho License, Version 1.0 (the "License"); you may not use this
 file except in compliance with the License.
 You may obtain a copy of the License at: http://manywho.com/sharedsource
 Unless required by applicable law or agreed to in writing, software distributed under
 the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 KIND, either express or implied. See the License for the specific language governing
 permissions and limitations under the License.
 */

(function (manywho) {

    var calendarComponent;
    var calendarEvents;

    var eventTypeProperties = {
        start: 'Due Date Time',
        duration: 'Duration',
        subject: 'Subject',
        id: 'Activity Id'
    };

    function getPropertyValue(objectData, developerName) {

        if (objectData != null) {

            var properties = objectData.properties.filter(function (item) {

                return manywho.utils.isEqual(item.developerName, developerName, true);

            });

            // Check to make sure we found a match
            if (properties != null &&
                properties.length > 0) {

                return properties[0].contentValue;

            }

        }

    }

    function getDateAsMilliseconds(dateString) {

        if (!manywho.utils.isNullOrWhitespace(dateString)) {
            var d = new Date(dateString);
            return d.getTime();
        }

        return 0;

    }

    function getDisplayColumns(columns, outcomes) {

        var displayColumns = manywho.component.getDisplayColumns(columns) || [];

        if (outcomes.filter(function (outcome) {

                return !outcome.isBulkAction;

            }).length > 0) {

            displayColumns.unshift('mw-outcomes');

        }

        return displayColumns;

    }

    function renderHeader(searchValue, outcomes, flowKey, isSearchEnabled, onSearchChanged, onSearchEntered, search, changeToDayView, changeToWeekView, changeToMonthView, isObjectData, refresh, isDesignTime) {

        var lookUpKey = manywho.utils.getLookUpKey(flowKey);
        var headerElements = [];
        var searchElement = null;
        var outcomesElement = null;
        var refreshElement = null;
        var calendarViewElement = null;
        var mainElement = document.getElementById(lookUpKey);

        if (isObjectData) {

            var refreshAttributes = { className: 'btn btn-sm btn-default table-refresh', onClick: refresh };

            if (isDesignTime)
                refreshAttributes.disabled = 'disabled';

            refreshElement = React.DOM.button(refreshAttributes,
                React.DOM.span({ className: 'glyphicon glyphicon-refresh' }, null)
            );

        }

        calendarViewElement = React.DOM.div({ className: 'btn-group' }, [
            React.DOM.button({ className: 'btn btn-success', onClick: changeToDayView }, "Day"),
            React.DOM.button({ className: 'btn btn-success', onClick: changeToWeekView }, "Week"),
            React.DOM.button({ className: 'btn btn-success', onClick: changeToMonthView }, "Month")
        ]);

        if (isDesignTime)
            refreshAttributes.disabled = 'disabled';

        refreshElement = React.DOM.button(refreshAttributes,
            React.DOM.span({ className: 'glyphicon glyphicon-refresh' }, null)
        );

        if (isSearchEnabled) {

            var buttonAttributes = { className: 'btn btn-default', onClick: search };

            if (isDesignTime)
                buttonAttributes.disabled = 'disabled';

            searchElement = React.DOM.div({ className: 'input-group table-search' }, [
                React.DOM.input({ type: 'text', className: 'form-control', value: searchValue, placeholder: 'Search', onChange: onSearchChanged, onKeyUp: onSearchEntered }),
                React.DOM.span({ className: 'input-group-btn' },
                    React.DOM.button(buttonAttributes,
                        React.DOM.span({ className: 'glyphicon glyphicon-search' }, null)
                    )
                )
            ]);

        }

        if (outcomes) {

            outcomesElement =  React.DOM.div({ className: 'table-outcomes' }, outcomes.map(function (outcome) {

                return React.createElement(manywho.component.getByName('outcome'), { id: outcome.id, flowKey: flowKey });

            }));

        }

        if (mainElement && mainElement.clientWidth < 768) {

            headerElements = [outcomesElement, calendarViewElement, searchElement, refreshElement];

        }
        else {

            headerElements = [refreshElement, searchElement, outcomesElement, calendarViewElement];

        }

        if (headerElements.length > 0) {

            return React.DOM.div({ className: 'table-header clearfix' }, headerElements);

        }

        return null;

    }

    function renderFooter(pageIndex, hasMoreResults, onNext, onPrev, isDesignTime) {

        var footerElements = [];

        if (pageIndex > 1 || hasMoreResults) {

            footerElements.push(React.createElement(manywho.component.getByName('pagination'),
                {
                    pageIndex: pageIndex,
                    hasMoreResults: hasMoreResults,
                    containerClasses: 'pull-right',
                    onNext: onNext,
                    onPrev: onPrev,
                    isDesignTime: isDesignTime
                }
            ));

        }

        if (footerElements.length > 0) {

            return React.DOM.div({ className: 'table-footer clearfix' }, footerElements);

        }

        return null;

    }

    var calendar = React.createClass({

        outcomes: null,

        onSearchChanged: function (e) {

            if (this.props.isDesignTime)
                return;

            manywho.state.setComponent(this.props.id, { search: e.target.value }, this.props.flowKey, true);

            this.forceUpdate();

        },

        onSearchEnter: function (e) {

            if (e.keyCode == 13 && !this.props.isDesignTime) {

                e.stopPropagation();
                this.search();

            }

        },

        renderRows: function (objectData, outcomes, displayColumns) {

            var model = manywho.model.getComponent(this.props.id, this.props.flowKey);
            var outcomeComponent = manywho.component.getByName('outcome');
            calendarEvents = [];

            // If we have any calendar object data, attempt to grab out the fields
            if (objectData != null &&
                objectData.length > 0) {

                for (var i = 0; i < objectData.length; i++) {

                    var startMilliseconds = getDateAsMilliseconds(getPropertyValue(objectData[i], eventTypeProperties.start));
                    var duration = parseInt(getPropertyValue(objectData[i], eventTypeProperties.duration));
                    var endMilliseconds = startMilliseconds + (duration * 60000);

                    calendarEvents.push({
                        id: getPropertyValue(objectData[i], eventTypeProperties.id),
                        title: getPropertyValue(objectData[i], eventTypeProperties.subject),
                        class: "event-info",
                        start: startMilliseconds,
                        end: endMilliseconds,
                        rowOutcomes: outcomes
                    });

                }

            }

            if (calendarComponent != null) {
                calendarComponent.setOptions({ events_source: calendarEvents });
                calendarComponent.view();
            }

        },

        search: function () {

            if (this.props.isDesignTime)
                return;

            var model = manywho.model.getComponent(this.props.id, this.props.flowKey);
            var state = manywho.state.getComponent(this.props.id, this.props.flowKey);

            this.clearSelection();

            if (model.objectDataRequest) {

                manywho.engine.objectDataRequest(this.props.id, model.objectDataRequest, this.props.flowKey, manywho.settings.global('paging.table'), state.search, null, null, state.page);

            }
            else {

                var displayColumns = (manywho.component.getDisplayColumns(model.columns) || []).map(function(column) {

                    return column.typeElementPropertyId.toLowerCase();

                });

                this.setState({
                    objectData: model.objectData.filter(function(objectData) {

                        return objectData.properties.filter(function(property) {

                                return displayColumns.indexOf(property.typeElementPropertyId) != -1 && property.contentValue.toLowerCase().indexOf(state.search.toLowerCase()) != -1

                            }).length > 0

                    })
                });

                state.page = 1;
                manywho.state.setComponent(this.props.id, state, this.props.flowKey, true);

            }

        },

        refresh: function () {

            if (this.props.isDesignTime)
                return;

            manywho.state.setComponent(this.props.id, { search: '' }, this.props.flowKey, true);

            this.search();

        },

        changeToDayView: function() {

            if (calendarComponent != null) {
                calendarComponent.view('day');
            }

        },

        changeToWeekView: function() {

            if (calendarComponent != null) {
                calendarComponent.view('week');
            }

        },

        changeToMonthView: function() {

            if (calendarComponent != null) {
                calendarComponent.view('month');
            }

        },

        onRowClicked: function (e) {

            var selectedRows = this.state.selectedRows;

            var model = manywho.model.getComponent(this.props.id, this.props.flowKey);

            if (selectedRows.indexOf(e.currentTarget.id) == -1) {

                model.isMultiSelect ? selectedRows.push(e.currentTarget.id) : selectedRows = [e.currentTarget.id];

            }
            else {

                selectedRows.splice(selectedRows.indexOf(e.currentTarget.id), 1);

            }

            this.setState({ selectedRows: selectedRows });
            manywho.state.setComponent(this.props.id, { objectData: manywho.component.getSelectedRows(model, selectedRows) }, this.props.flowKey, true);

        },

        clearSelection: function () {

            this.setState({ selectedRows: [] });
            manywho.state.setComponent(this.props.id, { objectData: [] }, this.props.flowKey, true);

        },

        onOutcome: function (objectDataId, outcomeId) {

            var model = manywho.model.getComponent(this.props.id, this.props.flowKey);
            manywho.state.setComponent(model.id, { objectData: manywho.component.getSelectedRows(model, [objectDataId]) }, this.props.flowKey, true);

            var flowKey = this.props.flowKey;
            var outcome = manywho.model.getOutcome(outcomeId, this.props.flowKey);
            manywho.engine.move(outcome, this.props.flowKey)
                .then(function() {

                    if (outcome.isOut) {

                        manywho.engine.flowOut(outcome, flowKey);

                    }

                });

        },

        onNext: function() {

            var model = manywho.model.getComponent(this.props.id, this.props.flowKey);
            var state = manywho.state.getComponent(this.props.id, this.props.flowKey);

            if (!state.page) {

                state.page = 1;

            }

            state.page++;
            manywho.state.setComponent(this.props.id, state, this.props.flowKey, true);

            if (model.objectDataRequest || model.fileDataRequest)
                this.search();
            else if (model.attributes.pagination && manywho.utils.isEqual(model.attributes.pagination, 'true', true)) {
                this.forceUpdate();
            }

        },

        onPrev: function() {

            var model = manywho.model.getComponent(this.props.id, this.props.flowKey);
            var state = manywho.state.getComponent(this.props.id, this.props.flowKey);
            state.page--;

            manywho.state.setComponent(this.props.id, state, this.props.flowKey, true);

            if (model.objectDataRequest || model.fileDataRequest)
                this.search();
            else if (model.attributes.pagination && manywho.utils.isEqual(model.attributes.pagination, 'true', true)) {
                this.forceUpdate();
            }

        },

        getInitialState: function () {

            return {
                selectedRows: [],
                windowWidth: window.innerWidth,
                sortByOrder: 'ASC',
                lastOrderBy: '',
                objectData: null
            }

        },

        componentDidMount: function () {

            calendarComponent = $("#" + this.props.id).calendar(
                {
                    tmpl_path: "/tmpls/",
                    modal: "#" + this.props.id + "",
                    modal_type: "custom",
                    events_source: calendarEvents,
                    callback: this.onOutcome,
                    time_start: '08:00',
                    time_end: '18:00'
                }
            );

        },

        componentWillUnmount: function () {

            calendarComponent = null;

        },

        componentWillMount: function() {

            var model = manywho.model.getComponent(this.props.id, this.props.flowKey);
            if (!model.objectDataRequest) {

                this.setState({ objectData: model.objectData });

            }

        },

        componentWillReceiveProps: function(nextProps) {

            var model = manywho.model.getComponent(nextProps.id, nextProps.flowKey);
            var state = this.props.isDesignTime ? { error: null, loading: false } : manywho.state.getComponent(this.props.id, this.props.flowKey) || {};

            if (!model.objectDataRequest && !model.fileDataRequest && manywho.utils.isNullOrWhitespace(state.search) && (manywho.utils.isNullOrWhitespace(state.page) || state.page == 1)) {

                this.setState({ objectData: model.objectData });

            }

        },

        render: function () {

            manywho.log.info('Rendering Google Chart: ' + this.props.id);

            var model = manywho.model.getComponent(this.props.id, this.props.flowKey);
            var state = this.props.isDesignTime ? { error: null, loading: false } : manywho.state.getComponent(this.props.id, this.props.flowKey) || {};

            this.outcomes = manywho.model.getOutcomes(this.props.id, this.props.flowKey);

            var objectData = this.props.isDesignTime ? [] : model.objectData;

            if (model.objectData && state.objectData && !this.state.objectData) {

                objectData = model.objectData.map(function (modelItem) {

                    var stateObjectData = state.objectData.filter(function (stateItem) {

                        return manywho.utils.isEqual(modelItem.externalId, stateItem.externalId) && manywho.utils.isEqual(modelItem.internalId, stateItem.internalId);

                    })[0];

                    if (stateObjectData) {

                        return manywho.utils.extend({}, [modelItem, stateObjectData]);

                    }
                    else {

                        return modelItem;

                    }

                });

            }

            var displayColumns = (this.props.isDesignTime) ? [] : getDisplayColumns(model.columns, this.outcomes);
            var hasMoreResults = (model.objectDataRequest && model.objectDataRequest.hasMoreResults) || (model.fileDataRequest && model.fileDataRequest.hasMoreResults);
            var content = null;
            var rowOutcomes = this.outcomes.filter(function (outcome) { return !outcome.isBulkAction });
            var headerOutcomes = this.outcomes.filter(function (outcome) { return outcome.isBulkAction });

            if (this.state.objectData)
            {
                objectData = this.state.objectData;
            }

            if (state.error) {

                content = React.DOM.div({ className: 'table-error' }, [
                    React.DOM.p({ className: 'lead' }, state.error.message),
                    React.DOM.button({ className: 'btn btn-danger', onClick: this.search }, 'Retry')
                ]);

            }
            else if (displayColumns.length == 0) {

                content = React.DOM.div({ className: 'table-error' },
                    React.DOM.p({ className: 'lead' }, 'No display columns have been defined for this table')
                );

            }
            else {

                content = this.renderRows(objectData || [], rowOutcomes, displayColumns);
                content = React.DOM.div({ id: this.props.id }, null);

            }

            var classNames = [];

            if (model.isVisible == false)
                classNames.push('hidden');

            classNames = classNames.concat(manywho.styling.getClasses(this.props.parentId, this.props.id, "google-chart", this.props.flowKey));

            if (model.attributes && model.attributes.classes) {

                classNames = classNames.join(' ') + ' ' + model.attributes.classes;

            }
            else {

                classNames = classNames.join(' ');

            }

            var validationElement = null;
            if (typeof model.isValid !== 'undefined' && model.isValid == false) {

                validationElement = React.DOM.div({ className: 'has-error' }, React.DOM.span({ className: 'help-block' }, model.validationMessage));

            }

            if (model.isVisible == false) {
                classNames += ' hidden';
            }

            return React.DOM.div({ className: classNames }, [
                renderHeader(state.search, headerOutcomes, this.props.flowKey, model.isSearchable, this.onSearchChanged, this.onSearchEnter, this.search, this.changeToDayView, this.changeToWeekView, this.changeToMonthView, (model.objectDataRequest || model.fileDataRequest), this.refresh, this.props.isDesignTime),
                content,
                renderFooter(state.page || 1, hasMoreResults, this.onNext, this.onPrev, this.props.isDesignTime),
                React.createElement(manywho.component.getByName('wait'), { isVisible: state.loading, message: state.loading && state.loading.message, isSmall: true }, null)
            ]);

        }

    });

    manywho.component.register("calendar", calendar);

}(manywho));
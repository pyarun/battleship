import * as _ from 'lodash';

export const playerScreen = _.template("\
================================= \n\
Player: ${ player_name} \n\
================================= \n\
${board}  \n\
");